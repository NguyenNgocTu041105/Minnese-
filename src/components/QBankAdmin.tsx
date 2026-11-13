import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Database,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Edit3,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  FileText,
  Sliders,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Info,
  Layers,
  Send,
  AlertCircle,
  Key,
  ShieldAlert,
  Eye,
  EyeOff,
  Lock,
  Clock,
  TrendingUp,
  BarChart3,
  ListChecks,
  Trash2,
  Play,
  Pause,
  Zap,
  Upload,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Code,
  Volume2,
  Camera,
} from 'lucide-react';
import { AIExamStudio } from './Admin/AIExamStudio';
import { auth } from '../lib/firebase';
import { HSKIllustrationCanvas, resolveSceneKey } from './HSKIllustrationCanvas';
import { ExportExamModal, downloadExportFile } from './Admin/ExportExamModal';
import { GoldenPromptLibraryModal } from './Admin/GoldenPromptLibraryModal';
import { HSKMockExam } from './HSKMockExam';
import {
  buildExternalAiPrompt,
  EXTERNAL_MODEL_LABELS,
  EXTERNAL_PROMPT_FORMAT_LABELS,
  type ExternalAiModelTarget,
  type ExternalPromptFormatType,
} from '../utils/externalAiPromptBuilder';
import {
  type CustomExamSet,
  createCustomExamSet,
  loadCustomExamSets,
  saveCustomExamSetToStorage,
  deleteCustomExamSetFromStorage,
} from '../utils/customExamSetManager';

export interface PendingQuestionItem {
  id: string;
  batch_id?: string | null;
  stem: string;
  passage?: string | null;
  options: string[];
  answer_idx: number;
  pinyin?: string | null;
  explanation_vi: string;
  level: number;
  skill: string;
  part_type: string;
  illustration_theme?: string | null;
  options_images?: string[];
  topic?: string | null;
  difficulty_tier?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'disabled' | string;
  provider_used?: string | null;
  rejection_note?: string | null;
  content_hash?: string | null;
  created_at?: string;
  updated_at?: string;
  distractor_rationales?: Array<{
    optionIdx: number;
    optionText: string;
    rationaleVi: string;
    isCorrect: boolean;
  }>;
  has_distractor_rationales?: boolean;
  audio_url?: string | null;
  validation_diagnostics?: {
    valid: boolean;
    warnings: string[];
    errors: string[];
  };
}

export interface GenerationHistoryItem {
  id?: number;
  batch_id: string;
  level?: number;
  skill?: string;
  count_requested?: number;
  count_generated?: number;
  provider_used: string;
  model_name?: string;
  status: string;
  details?: string;
  created_at?: string;
  timestamp?: string;
}

export interface ProgressData {
  success: boolean;
  pending_by_level: Record<string, number>;
  approved_by_level: Record<string, number>;
  rejected_by_level?: Record<string, number>;
  total_pending: number;
  total_approved: number;
  generation_history: GenerationHistoryItem[];
}

export function formatThemeTag(theme?: string | null): string | null {
  if (!theme) return null;
  const t = theme.toLowerCase().trim();
  const emojiMap: Record<string, string> = {
    taxi: '🚕 Taxi',
    apple: '🍎 Quả táo',
    hospital: '🏥 Bệnh viện',
    train: '🚆 Tàu hỏa',
    school: '🏫 Trường học',
    airplane: '✈️ Máy bay',
    dog: '🐕 Con chó',
    cat: '🐈 Con mèo',
    book: '📖 Sách',
    water: '💧 Nước',
    tea: '🍵 Trà',
    clothes: '👕 Quần áo',
  };
  return emojiMap[t] || `🎨 ${theme}`;
}

export function parseUtcDate(raw?: string | null): Date {
  if (!raw) return new Date();
  const trimmed = String(raw).trim();
  if (!trimmed) return new Date();
  if (trimmed.endsWith('Z') || /[+-]\d{2}(:\d{2})?$/.test(trimmed)) {
    return new Date(trimmed);
  }
  return new Date(trimmed.replace(' ', 'T') + 'Z');
}

/**
 * Reorders an array of items from sourceIdx to destIdx.
 * Returns a new array shallow-copy with the item repositioned.
 */
export function reorderArray<T>(items: T[], sourceIdx: number, destIdx: number): T[] {
  if (
    !Array.isArray(items) ||
    sourceIdx < 0 ||
    sourceIdx >= items.length ||
    destIdx < 0 ||
    destIdx >= items.length ||
    sourceIdx === destIdx
  ) {
    return Array.isArray(items) ? [...items] : [];
  }
  const result = [...items];
  const [removed] = result.splice(sourceIdx, 1);
  result.splice(destIdx, 0, removed);
  return result;
}

/**
 * Reorders an options array from sourceIdx to destIdx while dynamically recalculating
 * answer_idx so that the correct answer option remains strictly intact.
 *
 * Mathematical Invariant:
 * const previousCorrectOption = currentOptions[currentAnswerIdx];
 * const nextOptions = reorder(currentOptions, sourceIdx, destIdx);
 * const nextAnswerIdx = nextOptions.indexOf(previousCorrectOption);
 */
export function reorderOptions(
  options: string[],
  answerIdx: number,
  sourceIdx: number,
  destIdx: number
): { options: string[]; answer_idx: number } {
  if (
    !Array.isArray(options) ||
    options.length <= 1 ||
    sourceIdx < 0 ||
    sourceIdx >= options.length ||
    destIdx < 0 ||
    destIdx >= options.length ||
    sourceIdx === destIdx
  ) {
    return { options: Array.isArray(options) ? [...options] : [], answer_idx: answerIdx };
  }

  const nextOptions = reorderArray(options, sourceIdx, destIdx);

  // Calculate next answer_idx via deterministic permutation mapping
  let nextAnswerIdx = answerIdx;
  if (answerIdx === sourceIdx) {
    nextAnswerIdx = destIdx;
  } else if (sourceIdx < destIdx && answerIdx > sourceIdx && answerIdx <= destIdx) {
    nextAnswerIdx = answerIdx - 1;
  } else if (sourceIdx > destIdx && answerIdx >= destIdx && answerIdx < sourceIdx) {
    nextAnswerIdx = answerIdx + 1;
  }

  return {
    options: nextOptions,
    answer_idx: nextAnswerIdx,
  };
}

/**
 * Formats a 0-based question sequence index into the Vietnamese canonical label: Câu {idx + 1}
 */
export function formatSequenceNumber(index: number): string {
  return `Câu ${index + 1}`;
}

export interface PartTypeDefinition {
  value: string;
  label: string;
  skill: 'reading' | 'listening' | 'writing';
  minLevel: number;
  maxLevel: number;
  blueprintNote: string;
}

export const ALL_PART_TYPES: PartTypeDefinition[] = [
  // Reading
  {
    value: 'read_fill_blank_4opt',
    label: 'Điền từ vào chỗ trống câu đơn (Fill in the blank)',
    skill: 'reading',
    minLevel: 1,
    maxLevel: 6,
    blueprintNote: 'Khớp 100% Reading Part 1/2/3',
  },
  {
    value: 'read_comprehension_4opt',
    label: 'Đọc hiểu đoạn văn chọn đáp án (Comprehension)',
    skill: 'reading',
    minLevel: 1,
    maxLevel: 6,
    blueprintNote: 'Khớp 100% Reading Comprehension',
  },
  {
    value: 'read_cloze_passages_4opt',
    label: 'Điền từ đoạn văn dài / Thành ngữ (Cloze Passages)',
    skill: 'reading',
    minLevel: 4,
    maxLevel: 6,
    blueprintNote: 'Đặc thù HSK 4–6 (Cloze Passages)',
  },
  {
    value: 'read_find_faulty_sentence_4opt',
    label: 'Bệnh cú — Tìm câu có lỗi ngữ pháp (Find Faulty Sentence)',
    skill: 'reading',
    minLevel: 5,
    maxLevel: 6,
    blueprintNote: 'Trọng điểm HSK 5–6 (Reading Part 1)',
  },

  // Listening
  {
    value: 'listen_picture_match_4opt',
    label: 'Nghe câu / nhìn tranh chọn đáp án (Picture Match)',
    skill: 'listening',
    minLevel: 1,
    maxLevel: 3,
    blueprintNote: 'Dành riêng HSK 1–3 (Listening Part 1/2)',
  },
  {
    value: 'listen_dialogue_qa_4opt',
    label: 'Nghe đối thoại ngắn chọn đáp án (Dialogue Q&A)',
    skill: 'listening',
    minLevel: 1,
    maxLevel: 6,
    blueprintNote: 'Khớp 100% Listening Dialogue',
  },
  {
    value: 'listen_talks_qa_4opt',
    label: 'Nghe bài giảng / phỏng vấn chuyên sâu (Monologue/Talks)',
    skill: 'listening',
    minLevel: 4,
    maxLevel: 6,
    blueprintNote: 'Đặc thù HSK 4–6 (Listening Part 2)',
  },

  // Writing
  {
    value: 'write_sentence_reorder_4opt',
    label: 'Sắp xếp trật tự từ thành câu hoàn chỉnh (Sentence Reorder)',
    skill: 'writing',
    minLevel: 1,
    maxLevel: 5,
    blueprintNote: 'Dành cho HSK 1–5 (Writing Section)',
  },
  {
    value: 'write_topic_essay_300chars',
    label: 'Viết đoạn văn / nghị luận theo chủ đề (Topic Essay)',
    skill: 'writing',
    minLevel: 4,
    maxLevel: 6,
    blueprintNote: 'Dành cho HSK 4–6 (Writing Section)',
  },
  {
    value: 'write_summary_shortening_400chars',
    label: 'Tóm tắt rút gọn văn bản (Summary Shortening ~400 chữ)',
    skill: 'writing',
    minLevel: 6,
    maxLevel: 6,
    blueprintNote: 'Đặc thù HSK 6 (Writing Part 1, 60 điểm)',
  },
];

export const LEVEL_TOPIC_SUGGESTIONS: Record<number, string[]> = {
  1: ['Gia đình & Trường học', 'Ăn uống & Mua sắm', 'Thời tiết & Thời gian', 'Giao thông & Đi lại'],
  2: ['Sinh hoạt hằng ngày', 'Sở thích & Thể thao', 'Du lịch & Khách sạn', 'Hỏi đường & Mua sắm'],
  3: ['Học tập & Thi cử', 'Môi trường sống', 'Công việc văn phòng', 'Giao lưu bạn bè'],
  4: ['Phỏng vấn & Tuyển dụng', 'Giao thông & Du lịch', 'Sức khỏe & Đời sống', 'Công nghệ & Internet'],
  5: ['Kinh doanh & Khởi nghiệp', 'Văn hóa & Lịch sử', 'Tâm lý & Xã hội', 'Khoa học & Đời sống'],
  6: ['Trí tuệ nhân tạo & Công nghệ', 'Kinh tế vĩ mô & Tài chính', 'Triết học & Nhận thức', 'Bảo tồn di sản & Sinh thái'],
};

/**
 * Tách nội dung câu hỏi nghe thành: Lời thoại kịch bản nghe (Audio) và Câu hỏi trên màn hình
 * Giúp âm thanh chỉ phát đúng phần hội thoại, còn câu hỏi thì hiển thị cùng các đáp án.
 */
export function parseListeningParts(
  stem: string,
  pinyin?: string | null,
  partType?: string
): {
  dialoguePart: string;
  questionPart: string;
  questionPinyin: string;
} {
  if (!stem) return { dialoguePart: '', questionPart: '', questionPinyin: '' };

  const match = stem.match(/(?:[\r\n\s]+|^)(问\s*[:：].*|★.*)$/s);
  if (match && match.index !== undefined && match.index > 0) {
    const questionPart = match[1].trim();
    const dialoguePart = stem.slice(0, match.index).trim();

    let questionPinyin = '';
    if (pinyin) {
      const pinyinMatch = pinyin.match(/(?:[\r\n\s]+|^)(wèn\s*[:：].*|wen\s*[:：].*|★.*)$/is);
      if (pinyinMatch) {
        questionPinyin = pinyinMatch[1].trim();
      }
    }
    return { dialoguePart, questionPart, questionPinyin };
  }

  // Dialogue without explicit "问：" or picture-matching questions
  const hasDialogueSpeakers = /(?:^|[\r\n\s]+)(?:男|女|爸爸|妈妈|小明|小华|小红|李老师|王老师|甲|乙)\s*[:：]/.test(stem);
  const isPictureMatch = Boolean(partType && partType.includes('picture_match'));

  if (hasDialogueSpeakers || isPictureMatch) {
    return {
      dialoguePart: stem.trim(),
      questionPart: isPictureMatch
        ? '🎧 Nghe đoạn thoại/câu và chọn bức tranh tương ứng'
        : '🎧 Nghe đoạn thoại để chọn đáp án đúng',
      questionPinyin: '',
    };
  }

  return { dialoguePart: stem.trim(), questionPart: stem.trim(), questionPinyin: pinyin || '' };
}

export interface QbQuestionItem {
  question_id: string;
  level: number;
  skill: string;
  part_type: string;
  stem: string;
  passage?: string | null;
  audio_url?: string | null;
  options_images?: string[];
  options: string[];
  answer_index: number;
  explanation_vi: string;
  pinyin_stem?: string | null;
  vocab_tags?: string[];
  topic?: string | null;
  difficulty?: string | null;
  display_label?: string | null;
  status: 'needs_review' | 'approved' | 'rejected' | 'pending' | string;
  content_hash?: string;
  provenance?: {
    batch_id?: string;
    llm_model?: string;
    generator?: string;
    created_at?: string;
  };
  qa?: {
    structure_ok?: boolean;
    level_ok?: boolean;
    out_of_level_words?: string[];
    notes?: string[];
  };
  critical_flags?: {
    flags: string[];
    has_char_noise: boolean;
    char_noise_reasons: string[];
    has_solver_ambiguity: boolean;
    has_out_of_level: boolean;
    has_critical: boolean;
  };
}

export interface SyllabusLevelCoverage {
  total_words: number;
  used_words: number;
  coverage_ratio: number;
}

export interface StatsData {
  total: number;
  total_questions: number;
  by_status: {
    approved?: number;
    needs_review?: number;
    rejected?: number;
    pending?: number;
  };
  by_level: Record<string, number>;
  flags_summary?: {
    char_noise?: number;
    solver_ambiguity?: number;
    out_of_level?: number;
    total_with_flags?: number;
  };
  qa_flags?: Record<string, any>;
  eligible_for_sync: number;
  syllabus_coverage: Record<string, SyllabusLevelCoverage>;
}

export const QBANK_TOKEN_STORAGE_KEY = 'qbank_admin_token';

export function getQBankToken(): string {
  if (typeof window === 'undefined') return '';
  const stored = sessionStorage.getItem(QBANK_TOKEN_STORAGE_KEY) || localStorage.getItem(QBANK_TOKEN_STORAGE_KEY);
  if (stored) return stored.trim();
  return '';
}

export function setQBankToken(token: string): void {
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem(QBANK_TOKEN_STORAGE_KEY, token.trim());
      localStorage.setItem(QBANK_TOKEN_STORAGE_KEY, token.trim());
    } else {
      sessionStorage.removeItem(QBANK_TOKEN_STORAGE_KEY);
      localStorage.removeItem(QBANK_TOKEN_STORAGE_KEY);
    }
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Defensive API Call Helper:
 * Ensures responses are strictly valid JSON, attaches QBANK_ADMIN_TOKEN,
 * checks HTTP status (including 401/403 auth checks), and handles network or server errors.
 * Never allows HTML (<!DOCTYPE) error pages or JSON parse exceptions to crash the UI.
 */
async function safeApiCall<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const token = getQBankToken();
    const headers = new Headers(options?.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      headers.set('X-QBank-Admin-Token', token);
      headers.set('X-QBank-Token', token);
    }

    // Automatically attach cryptographically signed Firebase ID Token for authenticated Admins
    if (auth?.currentUser) {
      try {
        const firebaseIdToken = await auth.currentUser.getIdToken();
        if (firebaseIdToken) {
          headers.set('X-Firebase-Id-Token', firebaseIdToken);
          if (!token) {
            headers.set('Authorization', `Bearer ${firebaseIdToken}`);
          }
        }
      } catch {
        // Ignore token fetch errors and fall back to manual QBANK_ADMIN_TOKEN if present
      }
    }

    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';

    // Handle 401/403 auth failures gracefully
    if (res.status === 401 || res.status === 403) {
      let errMsg = 'Phiên quản trị QBank chưa được xác thực hoặc token không hợp lệ (401/403).';
      if (contentType.includes('application/json')) {
        try {
          const errJson = await res.json();
          if (errJson.error) errMsg = errJson.error;
        } catch {}
      }
      return {
        success: false,
        statusCode: res.status,
        error: errMsg,
      };
    }

    if (!contentType.includes('application/json')) {
      return {
        success: false,
        statusCode: res.status,
        error: `Không thể kết nối tới máy chủ backend hoặc máy chủ phản hồi không đúng định dạng JSON (${res.status} ${res.statusText || 'Non-JSON'}). Vui lòng kiểm tra tiến trình Express backend.`,
      };
    }
    const json = await res.json();
    if (!res.ok || json.success === false) {
      return {
        success: false,
        statusCode: res.status,
        data: json,
        error: json.message || json.error || `Yêu cầu thất bại với mã lỗi HTTP ${res.status}`,
      };
    }
    return { success: true, data: json, statusCode: res.status };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Yêu cầu quá thời gian chờ (Timeout).' };
    }
    return {
      success: false,
      error: 'Không thể kết nối tới máy chủ backend. Vui lòng kiểm tra kết nối mạng và đảm bảo server Express đang chạy.',
    };
  }
}

/**
 * Character noise detector:
 * Checks for critical flags, QA notes, and Latin/Vietnamese/parentheses in Chinese text.
 */
export function detectCharNoise(q: QbQuestionItem): { hasNoise: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (q.critical_flags?.has_char_noise) {
    if (q.critical_flags.char_noise_reasons && q.critical_flags.char_noise_reasons.length > 0) {
      reasons.push(...q.critical_flags.char_noise_reasons);
    } else {
      reasons.push('Phát hiện cờ ký tự nhiễu');
    }
  }

  if (q.qa?.notes) {
    for (const note of q.qa.notes) {
      if (note.toLowerCase().includes('nhiễu')) {
        if (!reasons.includes(note)) {
          reasons.push(note);
        }
      }
    }
  }

  const latinOrVietnamese = /[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;
  const parenNoise = /[()（）]/;

  if (latinOrVietnamese.test(q.stem || '')) {
    reasons.push('Câu dẫn chứa chữ Latin hoặc tiếng Việt có dấu');
  }
  if (parenNoise.test(q.stem || '')) {
    reasons.push('Câu dẫn chứa chú thích trong dấu ngoặc');
  }

  if (q.options && Array.isArray(q.options)) {
    q.options.forEach((opt, idx) => {
      const label = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
      if (latinOrVietnamese.test(opt || '')) {
        reasons.push(`Phương án ${label} chứa chữ Latin hoặc tiếng Việt`);
      }
      if (parenNoise.test(opt || '')) {
        reasons.push(`Phương án ${label} chứa chú thích trong dấu ngoặc`);
      }
    });
  }

  return {
    hasNoise: reasons.length > 0,
    reasons,
  };
}

// Isolated countdown component so 1-second ticks never re-render the 9,000-line QBankAdmin tree
const SchedulerCountdown = React.memo(
  ({ nextRunTime, isRunning }: { nextRunTime?: string | null; isRunning?: boolean }) => {
    const [secLeft, setSecLeft] = useState<number | null>(null);

    useEffect(() => {
      if (isRunning || !nextRunTime) {
        setSecLeft(null);
        return;
      }
      const update = () => {
        const diffMs = new Date(nextRunTime).getTime() - Date.now();
        setSecLeft(Math.max(0, Math.round(diffMs / 1000)));
      };
      update();
      const timer = setInterval(update, 1000);
      return () => clearInterval(timer);
    }, [nextRunTime, isRunning]);

    if (isRunning) {
      return <span>Đang tự động sinh câu hỏi...</span>;
    }
    if (secLeft !== null && secLeft > 0) {
      return (
        <span>
          Lần chạy tự động kế tiếp: trong {Math.floor(secLeft / 60).toString().padStart(2, '0')}:
          {(secLeft % 60).toString().padStart(2, '0')}
        </span>
      );
    }
    return <span>Chuẩn bị kích hoạt đợt tiếp theo...</span>;
  }
);

export const QBankAdmin: React.FC = () => {
  // Navigation / sub-view state: 'duyet_de' is the first sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'duyet_de' | 'review' | 'generate' | 'import' | 'studio' | 'sync' | 'coverage'>('duyet_de');
  const [hasUserSwitchedTab, setHasUserSwitchedTab] = useState(false);

  // Universal Question Import state
  const [importInputText, setImportInputText] = useState('');
  const [importLevel, setImportLevel] = useState<number>(1);
  const [importSkill, setImportSkill] = useState<'listening' | 'reading' | 'writing'>('reading');
  const [importPartType, setImportPartType] = useState<string>('read_fill_blank_4opt');
  const [importTopic, setImportTopic] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isAutoFormatting, setIsAutoFormatting] = useState<boolean>(false);
  const [generatingAudioIds, setGeneratingAudioIds] = useState<Set<string>>(new Set());
  const [listeningScript, setListeningScript] = useState<string>('');
  const [isListeningScriptOpen, setIsListeningScriptOpen] = useState<boolean>(false);

  // Audio TTS Voice Selection & Intro Prelude Chime
  const [selectedTtsVoice, setSelectedTtsVoice] = useState<string>('auto');
  const [withIntroChime, setWithIntroChime] = useState<boolean>(true);
  const [isPlayingWebSpeechId, setIsPlayingWebSpeechId] = useState<string | null>(null);
  const [isAuditioningVoiceId, setIsAuditioningVoiceId] = useState<string | null>(null);
  const [expandedExplanationIds, setExpandedExplanationIds] = useState<Set<string>>(new Set());

  const toggleExplanation = (id: string) => {
    setExpandedExplanationIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const isExplanationOpen = (id: string) => !expandedExplanationIds.has(id);

  // Milestone M2 & M4: 4-mode Import Switcher & OCR Image Ingestion state
  const [importMode, setImportMode] = useState<'file' | 'text' | 'prompt' | 'ocr'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDragActive, setFileDragActive] = useState<boolean>(false);
  const [fileProcessingStep, setFileProcessingStep] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Milestone M4: OCR Image Ingestion pipeline state
  const [ocrState, setOcrState] = useState<'idle' | 'reading' | 'ocr' | 'parsing' | 'done'>('idle');
  const [ocrProgressMsg, setOcrProgressMsg] = useState<string>('');
  const [ocrPreviewImage, setOcrPreviewImage] = useState<string | null>(null);
  const [ocrExtractedText, setOcrExtractedText] = useState<string>('');
  const [isOcrDragging, setIsOcrDragging] = useState<boolean>(false);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);

  // Milestone M2: Multi-format Exam Export modal state
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [exportModalTitle, setExportModalTitle] = useState<string>('Xuất đề thi HSK');
  const [exportModalCount, setExportModalCount] = useState<number>(0);
  const [exportModalQuestionIds, setExportModalQuestionIds] = useState<string[] | undefined>(undefined);
  const [exportModalQuestions, setExportModalQuestions] = useState<any[] | undefined>(undefined);
  const [exportModalFilterParams, setExportModalFilterParams] = useState<any | undefined>(undefined);
  const [exportModalDefaultTitle, setExportModalDefaultTitle] = useState<string>('De_Thi_HSK');
  const [isGoldenPromptsOpen, setIsGoldenPromptsOpen] = useState<boolean>(false);

  // Milestone M4: 1-Click External AI Prompt Builder state
  const [promptTargetModel, setPromptTargetModel] = useState<ExternalAiModelTarget>('deepseek');
  const [promptFormatType, setPromptFormatType] = useState<ExternalPromptFormatType>('multi_part_20q');
  const [promptQuestionCount, setPromptQuestionCount] = useState<number>(20);
  const [promptIncludePinyin, setPromptIncludePinyin] = useState<boolean>(true);

  const generatedExternalPrompt = useMemo(
    () =>
      buildExternalAiPrompt({
        level: importLevel,
        formatType: promptFormatType,
        modelTarget: promptTargetModel,
        questionCount: promptQuestionCount,
        topic: importTopic,
        includePinyin: promptIncludePinyin,
      }),
    [importLevel, promptFormatType, promptTargetModel, promptQuestionCount, importTopic, promptIncludePinyin]
  );

  // Milestone M5: Custom Exam Sets ("Kho Đề Của Tôi") & Instant CBT Mode state
  const [customExamSets, setCustomExamSets] = useState<CustomExamSet[]>(() => loadCustomExamSets());
  const [customExamTitleInput, setCustomExamTitleInput] = useState<string>('');
  const [activeCbtExamSet, setActiveCbtExamSet] = useState<CustomExamSet | null>(null);
  const [showExtractedRawText, setShowExtractedRawText] = useState<boolean>(false);

  // HSK 1-6 Multi-Dimensional Coverage & Cron History Dashboard state (4 required views)
  const [coverageOverview, setCoverageOverview] = useState<any | null>(null);
  const [coverageMatrix, setCoverageMatrix] = useState<any | null>(null);
  const [coverageVocab, setCoverageVocab] = useState<any | null>(null);
  const [cronHistory, setCronHistory] = useState<any | null>(null);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [matrixFilterLevel, setMatrixFilterLevel] = useState<string>('all');
  const [matrixFilterSkill, setMatrixFilterSkill] = useState<string>('all');
  const [matrixFilterPartType, setMatrixFilterPartType] = useState<string>('all');
  const [vocabFilterLevel, setVocabFilterLevel] = useState<string>('all');

  // Progress KPI & History state
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  // Pending questions query & filter state
  const [pendingQuestions, setPendingQuestions] = useState<PendingQuestionItem[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [isBackgroundPolling, setIsBackgroundPolling] = useState(false);
  const [newIncomingCount, setNewIncomingCount] = useState(0);
  const [pendingFilterLevel, setPendingFilterLevel] = useState<string>('all');
  const [pendingFilterSkill, setPendingFilterSkill] = useState<string>('all');
  const [pendingFilterPartType, setPendingFilterPartType] = useState<string>('all');
  const [pendingFilterTopic, setPendingFilterTopic] = useState<string>('all');
  const [pendingFilterDifficulty, setPendingFilterDifficulty] = useState<string>('all');
  const [pendingFilterStatus, setPendingFilterStatus] = useState<string>('pending');
  const [pendingSearchQuery, setPendingSearchQuery] = useState('');

  // Bulk selection state for pending questions
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<string>>(new Set());

  // HSK 3.0 Blueprint Balancer state
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);
  const [blueprintReport, setBlueprintReport] = useState<any>(null);
  const [balancingTarget, setBalancingTarget] = useState<number | 'all' | null>(null);
  const [activeBalancingLevel, setActiveBalancingLevel] = useState<number | null>(null);
  const [balanceMsg, setBalanceMsg] = useState<string | null>(null);

  // Inline edit state on pending cards
  const [editingPendingId, setEditingPendingId] = useState<string | null>(null);
  const [editPendingStem, setEditPendingStem] = useState('');
  const [editPendingOptions, setEditPendingOptions] = useState<string[]>(['', '', '', '']);
  const [editPendingAnswerIdx, setEditPendingAnswerIdx] = useState<number>(0);
  const [editPendingExplanationVi, setEditPendingExplanationVi] = useState('');
  const [editPendingPinyin, setEditPendingPinyin] = useState('');
  const [editPendingTheme, setEditPendingTheme] = useState('');
  const [editPendingLevel, setEditPendingLevel] = useState<number>(1);
  const [isSavingPendingEdit, setIsSavingPendingEdit] = useState(false);
  const [editPendingError, setEditPendingError] = useState<string | null>(null);

  // Reject modal state for single and bulk reject
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingPendingIds, setRejectingPendingIds] = useState<string[]>([]);
  const [rejectReasonNote, setRejectReasonNote] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Stats state
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Two-Flow Pool Stats (Practice vs Exam-Eligible)
  const [poolStats, setPoolStats] = useState<{
    total_practice: number;
    total_exam_eligible: number;
    practice_by_level: Record<string, number>;
    exam_eligible_by_level: Record<string, number>;
  } | null>(null);

  // Background Auto Question Scheduler state
  const [schedulerStatus, setSchedulerStatus] = useState<{
    enabled: boolean;
    isRunning: boolean;
    lastRunTime: string | null;
    nextRunTime: string | null;
    generatedToday: number;
    maxQuestionsPerDay: number;
    intervalHours: number;
    batchSize: number;
    targetLevel: number;
    preferredProvider?: 'auto' | 'ollama' | 'gemini' | 'groq' | 'deepseek';
    unlimitedDaily?: boolean;
    lastBatchId: string | null;
    lastError: string | null;
  } | null>(null);
  const [schedulerActionLoading, setSchedulerActionLoading] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(false);
  const [showOpsDashboard, setShowOpsDashboard] = useState(false);

  // Questions query & filter state
  const [questions, setQuestions] = useState<QbQuestionItem[]>([]);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterSkill, setFilterSkill] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('approved');
  const [searchQuery, setSearchQuery] = useState('');

  // Generation form state
  const [genLevel, setGenLevel] = useState<number>(1);
  const [genCount, setGenCount] = useState<number>(5);
  const [genPartType, setGenPartType] = useState<string>('read_fill_blank_4opt');
  const [genTopic, setGenTopic] = useState<string>('');
  const [genTargetGrammar, setGenTargetGrammar] = useState<string>('');
  const [genTargetVocab, setGenTargetVocab] = useState<string>('');
  const [genLesson, setGenLesson] = useState<string>('');
  const [genProvider, setGenProvider] = useState<string>('auto');
  const [genUseSolver, setGenUseSolver] = useState<boolean>(true);
  const [genContinuousLocalLoop, setGenContinuousLocalLoop] = useState<boolean>(false);
  const genContinuousLoopActiveRef = useRef<boolean>(false);
  const [genLoopTotalSaved, setGenLoopTotalSaved] = useState<number>(0);
  const [genLoopBatchesDone, setGenLoopBatchesDone] = useState<number>(0);
  const [dismissedLastError, setDismissedLastError] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genSummary, setGenSummary] = useState<{
    batch_id: string;
    count: number;
    savedCount: number;
    rejectedCount: number;
    generatedCount?: number;
    passedCount?: number;
    status: 'success' | 'partial' | 'all_rejected' | 'dry_run' | 'failed';
    isDryRun: boolean;
    model?: string;
    message?: string;
    rejectedReasons?: Array<{ reason: string; count: number }>;
    failures?: Array<{ candidate_index: number; error_count: number; errors: string[] }>;
  } | null>(null);

  const handleGenLevelChange = (newLevel: number) => {
    setGenLevel(newLevel);
    // Auto-adjust part type if current is incompatible with new level
    const currentDef = ALL_PART_TYPES.find((p) => p.value === genPartType);
    if (!currentDef || newLevel < currentDef.minLevel || newLevel > currentDef.maxLevel) {
      const compatible = ALL_PART_TYPES.find((p) => newLevel >= p.minLevel && newLevel <= p.maxLevel);
      if (compatible) {
        setGenPartType(compatible.value);
      }
    }
  };

  // Question editing modal state
  const [editingQuestion, setEditingQuestion] = useState<QbQuestionItem | null>(null);
  const [editStem, setEditStem] = useState('');
  const [editOptions, setEditOptions] = useState<string[]>(['', '', '', '']);
  const [editAnswerIndex, setEditAnswerIndex] = useState<number>(0);
  const [editExplanation, setEditExplanation] = useState('');
  const [editLevel, setEditLevel] = useState<number>(1);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Token modal state
  const [showTokenModal, setShowTokenModal] = useState<boolean>(false);
  const [tokenInput, setTokenInput] = useState<string>(() => getQBankToken());
  const [showTokenPassword, setShowTokenPassword] = useState<boolean>(false);
  const [tokenModalError, setTokenModalError] = useState<string | null>(null);
  const [pendingRetryFn, setPendingRetryFn] = useState<(() => Promise<void> | void) | null>(null);

  const promptTokenModal = useCallback((retryFn?: () => Promise<void> | void) => {
    setTokenInput(getQBankToken());
    setTokenModalError('Yêu cầu nhập QBANK_ADMIN_TOKEN để thực hiện thao tác.');
    if (retryFn) {
      setPendingRetryFn(() => retryFn);
    }
    setShowTokenModal(true);
  }, []);

  const handleSaveTokenAndRetry = async () => {
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      setTokenModalError('Mã token không được để trống.');
      return;
    }
    setQBankToken(trimmed);
    setShowTokenModal(false);
    setTokenModalError(null);
    if (pendingRetryFn) {
      const fn = pendingRetryFn;
      setPendingRetryFn(null);
      await fn();
    } else {
      loadStats();
      loadQuestions();
    }
  };

  // Flagged Review Override Modal state
  const [overrideQuestion, setOverrideQuestion] = useState<QbQuestionItem | null>(null);
  const [overrideConfirmWord, setOverrideConfirmWord] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);
  const [overrideModalError, setOverrideModalError] = useState<string | null>(null);

  const handleOpenReviewOverride = (q: QbQuestionItem) => {
    setOverrideQuestion(q);
    setOverrideConfirmWord('');
    setOverrideReason('');
    setOverrideModalError(null);
  };

  const handleConfirmReviewSubmit = async () => {
    if (!overrideQuestion) return;
    if (overrideConfirmWord.trim() !== 'duyet') {
      setOverrideModalError('Vui lòng gõ chính xác từ "duyet" để xác nhận.');
      return;
    }
    if (overrideReason.trim().length < 10) {
      setOverrideModalError('Lý do phê duyệt ngoại lệ bắt buộc phải có ít nhất 10 ký tự.');
      return;
    }

    setIsSubmittingOverride(true);
    setOverrideModalError(null);

    const res = await safeApiCall<{ success: boolean; question_id: string; status: string }>(
      '/api/qbank/review',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: overrideQuestion.question_id,
          action: 'approve',
          status: 'approve',
          override_reason: overrideReason.trim(),
          timestamp: new Date().toISOString(),
        }),
      }
    );

    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(handleConfirmReviewSubmit);
      setIsSubmittingOverride(false);
      return;
    }

    if (res.success && res.data) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.question_id === overrideQuestion.question_id ? { ...q, status: 'approved' } : q
        )
      );
      setActionSuccessMsg(
        `Đã phê duyệt ngoại lệ câu hỏi [${overrideQuestion.question_id}] thành công.`
      );
      setTimeout(() => setActionSuccessMsg(null), 4000);
      setOverrideQuestion(null);
      setOverrideConfirmWord('');
      setOverrideReason('');
      loadStats();
    } else {
      setOverrideModalError(res.error || 'Phê duyệt ngoại lệ gặp lỗi.');
    }
    setIsSubmittingOverride(false);
  };

  // Two-Phase Sync state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncPhase, setSyncPhase] = useState<'dry_running' | 'summary' | 'executing' | 'success'>('dry_running');
  const [dryRunData, setDryRunData] = useState<{
    success: boolean;
    is_dry_run?: boolean;
    total_eligible: number;
    count_synced: number;
    synced_count: number;
    skipped_duplicate_hash: number;
    skipped_near_duplicate: number;
    skipped_blocked_flags: number;
    backup_file?: string;
    backup_path?: string;
    blocked_questions?: Array<{ question_id: string; reason: string }>;
  } | null>(null);
  const [retypeCountInput, setRetypeCountInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    synced_count: number;
    backup_file?: string;
  } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleOpenSyncModal = async () => {
    setShowSyncModal(true);
    setSyncPhase('dry_running');
    setSyncError(null);
    setDryRunData(null);
    setRetypeCountInput('');

    // Phase 1: Always execute dry-run first
    const res = await safeApiCall<any>('/api/qbank/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ execute: false }),
    });

    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(handleOpenSyncModal);
      setShowSyncModal(false);
      return;
    }

    if (res.success && res.data) {
      setDryRunData(res.data);
      setSyncPhase('summary');
    } else {
      setSyncError(res.error || 'Kiểm tra thử nghiệm (Dry-Run) thất bại.');
      setSyncPhase('summary');
    }
  };

  const handleExecuteSync = async () => {
    if (!dryRunData) return;
    const eligibleCount = dryRunData.count_synced ?? dryRunData.synced_count ?? 0;
    if (retypeCountInput.trim() !== String(eligibleCount)) {
      setSyncError(`Vui lòng nhập chính xác số lượng câu hỏi (${eligibleCount}) để xác nhận nạp đề.`);
      return;
    }

    setIsSyncing(true);
    setSyncPhase('executing');
    setSyncError(null);

    const res = await safeApiCall<any>('/api/qbank/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ execute: true }),
    });

    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(handleExecuteSync);
      setSyncPhase('summary');
      setIsSyncing(false);
      return;
    }

    if (res.success && res.data) {
      const finalCount = res.data.count_synced ?? res.data.synced_count ?? eligibleCount;
      const backupPath = res.data.backup_file || res.data.backup_path;
      setSyncResult({
        synced_count: finalCount,
        backup_file: backupPath,
      });
      setSyncPhase('success');
      setActionSuccessMsg(
        `Đồng bộ thành công ${finalCount} câu hỏi đã duyệt vào Ngân hàng Đề thi Web.`
      );
      loadStats();
      loadQuestions();
    } else {
      setSyncError(res.error || 'Tiến trình đồng bộ đề thi gặp lỗi.');
      setSyncPhase('summary');
    }
    setIsSyncing(false);
  };

  // Action status message
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  /**
   * Load dashboard stats & CLEC coverage
   */
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    const res = await safeApiCall<StatsData>('/api/qbank/stats');
    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(loadStats);
    }
    if (res.success && res.data) {
      setStats(res.data);
    } else {
      setStatsError(res.error || 'Không thể tải số liệu thống kê.');
    }
    setStatsLoading(false);
  }, [promptTokenModal]);

  /**
   * Load questions list with active filters
   */
  const loadQuestions = useCallback(async () => {
    setQuestionsLoading(true);
    setQuestionsError(null);

    const params = new URLSearchParams();
    if (filterLevel !== 'all') {
      params.append('level', filterLevel);
    }
    if (filterSkill !== 'all') {
      params.append('skill', filterSkill);
    }
    if (filterStatus !== 'all') {
      params.append('status', filterStatus);
    }
    params.append('limit', '100');

    const res = await safeApiCall<{ total: number; questions: QbQuestionItem[] }>(
      `/api/qbank/questions?${params.toString()}`
    );

    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(loadQuestions);
    }

    if (res.success && res.data) {
      setQuestions(res.data.questions || []);
      setTotalQuestionsCount(res.data.total || (res.data.questions || []).length);
    } else {
      setQuestionsError(res.error || 'Không thể tải danh sách câu hỏi.');
    }
    setQuestionsLoading(false);
  }, [filterLevel, filterSkill, filterStatus, promptTokenModal]);


  /**
   * Load progress tracking metrics from /api/qbank/progress (fallback to /api/qbank/pending/stats)
   */
  const loadProgress = useCallback(async () => {
    setProgressLoading(true);
    setProgressError(null);
    let res = await safeApiCall<ProgressData>('/api/qbank/progress');
    if (!res.success) {
      res = await safeApiCall<ProgressData>('/api/qbank/pending/stats');
    }
    if (res.statusCode === 401 || res.statusCode === 403) {
      setProgressError('Yêu cầu QBANK_ADMIN_TOKEN.');
      setProgressLoading(false);
      return;
    }
    if (res.success && res.data) {
      setProgress(res.data);
    } else {
      setProgressError(res.error || 'Không thể tải số liệu tiến độ.');
    }
    setProgressLoading(false);
  }, [promptTokenModal]);

  /**
   * Load pending questions list with active filters
   * isBackground: when true, does not unmount list or show full spinner, smartly merges/prepends new items
   */
  const loadPendingQuestions = useCallback(async (
    overrideFilters?: {
      level?: string;
      skill?: string;
      part_type?: string;
      status?: string;
      topic?: string;
      difficulty?: string;
    } | React.SyntheticEvent | any,
    isBackground = false
  ) => {
    if (!isBackground) {
      setPendingLoading(true);
    } else {
      setIsBackgroundPolling(true);
    }
    setPendingError(null);

    const isFilterObj = Boolean(
      overrideFilters &&
      typeof overrideFilters === 'object' &&
      !('nativeEvent' in overrideFilters) &&
      ('level' in overrideFilters || 'skill' in overrideFilters || 'part_type' in overrideFilters || 'status' in overrideFilters || 'topic' in overrideFilters || 'difficulty' in overrideFilters)
    );
    const effLevel = isFilterObj && overrideFilters.level !== undefined ? overrideFilters.level : pendingFilterLevel;
    const effSkill = isFilterObj && overrideFilters.skill !== undefined ? overrideFilters.skill : pendingFilterSkill;
    const effPartType = isFilterObj && overrideFilters.part_type !== undefined ? overrideFilters.part_type : pendingFilterPartType;
    const effStatus = isFilterObj && overrideFilters.status !== undefined ? overrideFilters.status : pendingFilterStatus;
    const effTopic = isFilterObj && overrideFilters.topic !== undefined ? overrideFilters.topic : pendingFilterTopic;
    const effDifficulty = isFilterObj && overrideFilters.difficulty !== undefined ? overrideFilters.difficulty : pendingFilterDifficulty;

    const params = new URLSearchParams();
    if (effLevel !== 'all') {
      params.append('level', effLevel);
    }
    if (effSkill !== 'all') {
      params.append('skill', effSkill);
    }
    if (effPartType && effPartType !== 'all') {
      params.append('part_type', effPartType);
    }
    if (effStatus && effStatus !== 'all') {
      params.append('status', effStatus);
    }
    if (effTopic && effTopic !== 'all') {
      params.append('topic', effTopic);
    }
    if (effDifficulty && effDifficulty !== 'all') {
      params.append('difficulty_tier', effDifficulty);
    }
    params.append('limit', '200');

    const res = await safeApiCall<{ total: number; questions: PendingQuestionItem[] }>(
      `/api/qbank/pending?${params.toString()}`
    );

    if (res.statusCode === 401 || res.statusCode === 403) {
      if (!isBackground) {
        setPendingError('Yêu cầu QBANK_ADMIN_TOKEN.');
        promptTokenModal(() => loadPendingQuestions(overrideFilters));
        setPendingLoading(false);
      }
      setIsBackgroundPolling(false);
      return;
    }

    if (res.success && res.data) {
      const incoming = res.data.questions || [];
      if (isBackground) {
        // Smart merge: prepend new questions without resetting user's scroll or unmounting list!
        setPendingQuestions((prev) => {
          const prevIds = new Set(prev.map((q) => q.id));
          const brandNew = incoming.filter((q) => !prevIds.has(q.id));
          if (brandNew.length > 0) {
            setNewIncomingCount((cnt) => cnt + brandNew.length);
          }
          const incomingMap = new Map(incoming.map((q) => [q.id, q]));
          const updatedExisting = prev.map((oldQ) => incomingMap.get(oldQ.id) || oldQ);
          return [...brandNew, ...updatedExisting];
        });
      } else {
        setPendingQuestions(incoming);
        setNewIncomingCount(0);
      }
      setPendingTotal(res.data.total ?? incoming.length);
    } else {
      if (!isBackground) {
        setPendingError(res.error || 'Không thể tải danh sách câu hỏi chờ duyệt.');
      }
    }
    if (!isBackground) {
      setPendingLoading(false);
    }
    setIsBackgroundPolling(false);
  }, [pendingFilterLevel, pendingFilterSkill, pendingFilterPartType, pendingFilterStatus, pendingFilterTopic, pendingFilterDifficulty, promptTokenModal]);

  /**
   * Load Two-Flow Pool Stats (Practice vs Exam-Eligible)
   */
  const loadPoolStats = useCallback(async () => {
    const res = await safeApiCall<{ stats: any }>('/api/qbank/pools/stats');
    if (res.success && res.data?.stats) {
      setPoolStats(res.data.stats);
    }
  }, []);

  /**
   * Load Background Auto Question Scheduler status
   */
  const loadSchedulerStatus = useCallback(async () => {
    const res = await safeApiCall<{ status: any }>('/api/qbank/scheduler/status');
    if (res.success && res.data?.status) {
      setSchedulerStatus(res.data.status);
    }
  }, []);

  const loadBlueprintReport = useCallback(async () => {
    const res = await safeApiCall<{ report: any }>('/api/qbank/balancer/report');
    if (res.success && res.data?.report) {
      setBlueprintReport(res.data.report);
    }
  }, []);

  const handleRunBalancer = useCallback(async (level?: number) => {
    if (level !== undefined) {
      setBalancingTarget(level);
      setActiveBalancingLevel(level);
      setBalanceMsg(`Đang kích hoạt AI bù câu hỏi thiếu cho HSK ${level}...`);
      const res = await safeApiCall<{ success: boolean; message: string }>('/api/qbank/balancer/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, limit_per_skill: 3 }),
      });
      setBalancingTarget(null);
      setActiveBalancingLevel(null);
      if (res.success) {
        setBalanceMsg(res.data?.message || `Đã hoàn tất đợt bù câu hỏi cho HSK ${level}!`);
        loadBlueprintReport();
        loadPendingQuestions();
        loadProgress();
        loadStats();
      } else {
        setBalanceMsg(res.error || `Lỗi khi bù câu hỏi cho HSK ${level}.`);
      }
      setTimeout(() => setBalanceMsg(null), 8000);
    } else {
      setBalancingTarget('all');
      const incomplete = [1, 2, 3, 4, 5, 6].filter(
        (lvl) => !blueprintReport?.levels?.[String(lvl)]?.is_complete
      );
      if (incomplete.length === 0) {
        setBalanceMsg('Tất cả các cấp độ HSK 1–6 đã đủ chuẩn Blueprint!');
        setBalancingTarget(null);
        setActiveBalancingLevel(null);
        setTimeout(() => setBalanceMsg(null), 5000);
        return;
      }

      let totalSuccess = 0;
      for (let i = 0; i < incomplete.length; i++) {
        const lvl = incomplete[i];
        setActiveBalancingLevel(lvl);
        setBalanceMsg(`Đang bù câu hỏi thiếu cho HSK ${lvl} (${i + 1}/${incomplete.length})... Vui lòng đợi.`);
        const res = await safeApiCall<{ success: boolean; message: string }>('/api/qbank/balancer/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: lvl, limit_per_skill: 2 }),
        });
        if (res.success) {
          totalSuccess++;
          await loadBlueprintReport();
          loadPendingQuestions();
        }
      }
      setBalancingTarget(null);
      setActiveBalancingLevel(null);
      setBalanceMsg(`Đã hoàn tất đợt bù câu hỏi cho ${totalSuccess}/${incomplete.length} cấp độ thiếu!`);
      loadBlueprintReport();
      loadPendingQuestions();
      loadProgress();
      loadStats();
      setTimeout(() => setBalanceMsg(null), 8000);
    }
  }, [blueprintReport, loadBlueprintReport, loadPendingQuestions, loadProgress, loadStats]);

  const handleToggleScheduler = useCallback(async () => {
    setSchedulerActionLoading(true);
    const nextEnabled = !schedulerStatus?.enabled;
    const res = await safeApiCall<{ status: any }>('/api/qbank/scheduler/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: nextEnabled }),
    });
    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(handleToggleScheduler);
      setSchedulerActionLoading(false);
      return;
    }
    if (res.success && res.data?.status) {
      setSchedulerStatus(res.data.status);
      setActionSuccessMsg(
        nextEnabled
          ? 'Đã bật Robot Tự Động Sinh Câu Hỏi Nền!'
          : 'Đã tạm dừng Robot Tự Động Sinh Câu Hỏi Nền.'
      );
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } else {
      setActionErrorMsg(res.error || 'Không thể bật/tắt Robot sinh đề nền.');
      setTimeout(() => setActionErrorMsg(null), 5000);
    }
    setSchedulerActionLoading(false);
  }, [schedulerStatus, promptTokenModal]);

  const loadCoverageDashboard = useCallback(async () => {
    setCoverageLoading(true);
    const [ovRes, matRes, vocRes, histRes] = await Promise.all([
      safeApiCall<any>('/api/qbank/dashboard/overview'),
      safeApiCall<any>('/api/qbank/coverage/matrix'),
      safeApiCall<any>('/api/qbank/coverage/vocab'),
      safeApiCall<any>('/api/qbank/scheduler/history?limit=25'),
    ]);
    if (ovRes.success && ovRes.data) setCoverageOverview(ovRes.data);
    if (matRes.success && matRes.data) setCoverageMatrix(matRes.data);
    if (vocRes.success && vocRes.data) setCoverageVocab(vocRes.data);
    if (histRes.success && histRes.data) setCronHistory(histRes.data);
    setCoverageLoading(false);
  }, []);

  const handleTriggerSchedulerBatch = useCallback(async () => {
    setSchedulerActionLoading(true);
    setActionErrorMsg(null);
    const res = await safeApiCall<{
      success: boolean;
      backgroundStarted?: boolean;
      isRunning?: boolean;
      status?: any;
      batchId?: string;
      savedCount?: number;
      message?: string;
      error?: string;
    }>('/api/qbank/scheduler/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        background: true,
        batchSize: schedulerStatus?.batchSize,
        targetLevel: schedulerStatus?.targetLevel,
        preferredProvider: schedulerStatus?.preferredProvider,
        unlimitedDaily: schedulerStatus?.unlimitedDaily,
      }),
    });
    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(handleTriggerSchedulerBatch);
      setSchedulerActionLoading(false);
      return;
    }
    if (res.success && res.data?.success !== false) {
      if (res.data?.status) {
        setSchedulerStatus(res.data.status);
      } else {
        setSchedulerStatus((prev) => (prev ? { ...prev, isRunning: true } : prev));
      }
      setActionSuccessMsg(
        res.data?.message ||
          `🚀 Đã kích hoạt AI bắt đầu sinh đợt câu hỏi mới ở chế độ nền! Các câu hỏi mới sẽ tự động xuất hiện trong mục "Duyệt câu mới" sau ít giây.`
      );
      setTimeout(() => setActionSuccessMsg(null), 6000);
      loadSchedulerStatus();
    } else {
      const errMsg = res.data?.error || res.error || 'Không thể kích hoạt đợt sinh câu hỏi.';
      setActionErrorMsg(`Lỗi kích hoạt sinh đề: ${errMsg}`);
      setTimeout(() => setActionErrorMsg(null), 6000);
      loadSchedulerStatus();
    }
    setSchedulerActionLoading(false);
  }, [schedulerStatus, promptTokenModal, loadSchedulerStatus]);

  const handleUpdateSchedulerConfig = useCallback(async (updates: {
    intervalHours?: number;
    batchSize?: number;
    maxQuestionsPerDay?: number;
    targetLevel?: number;
    preferredProvider?: 'auto' | 'ollama' | 'gemini' | 'groq' | 'deepseek';
    unlimitedDaily?: boolean;
  }) => {
    setSchedulerActionLoading(true);
    const res = await safeApiCall<{ status: any }>('/api/qbank/scheduler/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(() => handleUpdateSchedulerConfig(updates));
      setSchedulerActionLoading(false);
      return;
    }
    if (res.success && res.data?.status) {
      setSchedulerStatus(res.data.status);
      setActionSuccessMsg('Đã cập nhật cấu hình Robot sinh đề nền!');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } else {
      setActionErrorMsg(res.error || 'Không thể lưu cấu hình Robot.');
      setTimeout(() => setActionErrorMsg(null), 5000);
    }
    setSchedulerActionLoading(false);
  }, [promptTokenModal]);

  const handleUpdateSchedulerTargetLevel = useCallback(async (level: number) => {
    setSchedulerActionLoading(true);
    const res = await safeApiCall<{ status: any }>('/api/qbank/scheduler/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetLevel: level }),
    });
    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(() => handleUpdateSchedulerTargetLevel(level));
      setSchedulerActionLoading(false);
      return;
    }
    if (res.success && res.data?.status) {
      setSchedulerStatus(res.data.status);
      setActionSuccessMsg(
        level === 0
          ? 'Đã cài đặt: Robot tự động xoay vòng thông minh cho HSK 1–6!'
          : `Đã cài đặt: Robot tự động sẽ sinh câu hỏi cho HSK ${level}!`
      );
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } else {
      setActionErrorMsg(res.error || 'Không thể lưu cấp độ HSK mục tiêu.');
      setTimeout(() => setActionErrorMsg(null), 5000);
    }
    setSchedulerActionLoading(false);
  }, [promptTokenModal]);

  // Poll scheduler status & pending questions smoothly while robot is enabled or running
  // Poll every 4s only while actively running; 15s when idle, and skip state updates if nothing changed
  useEffect(() => {
    if (!schedulerStatus?.enabled && !schedulerStatus?.isRunning) return;
    const pollMs = schedulerStatus?.isRunning ? 4000 : 15000;
    const interval = setInterval(async () => {
      const res = await safeApiCall<{ status: any }>('/api/qbank/scheduler/status');
      if (res.success && res.data?.status) {
        const nextStatus = res.data.status;
        const wasRunning = schedulerStatus?.isRunning;
        const hasStateChange =
          nextStatus.isRunning !== schedulerStatus?.isRunning ||
          nextStatus.generatedToday !== schedulerStatus?.generatedToday ||
          nextStatus.lastBatchId !== schedulerStatus?.lastBatchId;

        const hasUiChange =
          hasStateChange ||
          nextStatus.enabled !== schedulerStatus?.enabled ||
          nextStatus.preferredProvider !== schedulerStatus?.preferredProvider ||
          nextStatus.lastError !== schedulerStatus?.lastError ||
          nextStatus.nextRunTime !== schedulerStatus?.nextRunTime;

        if (hasUiChange) {
          setSchedulerStatus(nextStatus);
        }

        if (hasStateChange) {
          loadPendingQuestions(undefined, true);
          loadProgress();
          loadPoolStats();
        }

        if (wasRunning && !nextStatus.isRunning) {
          loadCoverageDashboard();
          if (nextStatus.lastError) {
            setActionErrorMsg(`Đợt sinh đề nền kết thúc với cảnh báo: ${nextStatus.lastError}`);
          } else {
            setActionSuccessMsg(
              `✅ Đã hoàn tất đợt sinh câu hỏi nền! Tiến độ hôm nay: ${nextStatus.generatedToday} câu.`
            );
          }
        }
      }
    }, pollMs);
    return () => clearInterval(interval);
  }, [schedulerStatus?.enabled, schedulerStatus?.isRunning, schedulerStatus?.generatedToday, schedulerStatus?.lastBatchId, schedulerStatus?.preferredProvider, schedulerStatus?.lastError, schedulerStatus?.nextRunTime, loadPendingQuestions, loadProgress, loadPoolStats, loadCoverageDashboard]);

  // Initial fetch: prioritize primary pending/progress data first, defer secondary analytics by 350ms
  useEffect(() => {
    loadPendingQuestions();
    loadProgress();
    loadStats();
    loadSchedulerStatus();
    const secondaryTimer = setTimeout(() => {
      loadQuestions();
      loadPoolStats();
      loadCoverageDashboard();
      loadBlueprintReport();
    }, 350);
    return () => clearTimeout(secondaryTimer);
  }, [loadStats, loadQuestions, loadProgress, loadPendingQuestions, loadPoolStats, loadSchedulerStatus, loadCoverageDashboard, loadBlueprintReport]);

  // Total pending count from progress or stats
  const totalPendingCount = useMemo(() => {
    if (typeof progress?.total_pending === 'number') {
      return progress.total_pending;
    }
    if (typeof stats?.by_status?.pending === 'number') {
      return stats.by_status.pending;
    }
    return pendingTotal;
  }, [progress, stats, pendingTotal]);

  // Auto-switch to review tab if user hasn't explicitly switched tab and there are legacy review items and no pending items
  useEffect(() => {
    if (activeSubTab === 'duyet_de' && !hasUserSwitchedTab) {
      const needsReview = stats?.by_status?.needs_review ?? 0;
      if (needsReview > 0 && totalPendingCount === 0 && pendingQuestions.length === 0) {
        setActiveSubTab('review');
      }
    }
  }, [stats, totalPendingCount, pendingQuestions.length, activeSubTab, hasUserSwitchedTab]);

  // Filtered pending questions with search
  const filteredPendingQuestions = useMemo(() => {
    let list = pendingQuestions;
    if (pendingFilterTopic !== 'all') {
      list = list.filter((item) => (item.topic || '').toLowerCase() === pendingFilterTopic.toLowerCase());
    }
    if (pendingFilterDifficulty !== 'all') {
      list = list.filter((item) => (item.difficulty_tier || '').toLowerCase() === pendingFilterDifficulty.toLowerCase());
    }
    if (!pendingSearchQuery.trim()) return list;
    const q = pendingSearchQuery.toLowerCase().trim();
    return list.filter((item) => {
      const matchStem = item.stem?.toLowerCase().includes(q);
      const matchOptions = item.options?.some((opt) => opt?.toLowerCase().includes(q));
      const matchExplanation = item.explanation_vi?.toLowerCase().includes(q);
      const matchId = item.id?.toLowerCase().includes(q);
      const matchTheme = item.illustration_theme?.toLowerCase().includes(q);
      const matchBatch = item.batch_id?.toLowerCase().includes(q);
      const matchTopic = item.topic?.toLowerCase().includes(q);
      return matchStem || matchOptions || matchExplanation || matchId || matchTheme || matchBatch || matchTopic;
    });
  }, [pendingQuestions, pendingFilterTopic, pendingFilterDifficulty, pendingSearchQuery]);

  // Bulk selection helpers
  const isAllPendingSelected = useMemo(() => {
    if (filteredPendingQuestions.length === 0) return false;
    return filteredPendingQuestions.every((q) => selectedPendingIds.has(q.id));
  }, [filteredPendingQuestions, selectedPendingIds]);

  const handleToggleSelectAllPending = () => {
    if (isAllPendingSelected) {
      setSelectedPendingIds((prev) => {
        const next = new Set(prev);
        filteredPendingQuestions.forEach((q) => next.delete(q.id));
        return next;
      });
    } else {
      setSelectedPendingIds((prev) => {
        const next = new Set(prev);
        filteredPendingQuestions.forEach((q) => next.add(q.id));
        return next;
      });
    }
  };

  const handleToggleSelectPending = (id: string) => {
    setSelectedPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  /**
   * Approve single or multiple pending questions
   */
  const handleApprovePending = async (idsToApprove: string[]) => {
    if (idsToApprove.length === 0) return;
    const isSingle = idsToApprove.length === 1;
    const payload = isSingle ? { id: idsToApprove[0] } : { ids: idsToApprove };

    const res = await safeApiCall<{
      success: boolean;
      approved_count?: number;
      approved_ids?: string[];
    }>('/api/qbank/pending/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(() => handleApprovePending(idsToApprove));
      return;
    }

    if (res.success) {
      const count = res.data?.approved_count ?? idsToApprove.length;
      setActionSuccessMsg(`Đã phê duyệt thành công ${count} câu hỏi vào kho đề thi.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);

      setSelectedPendingIds((prev) => {
        const next = new Set(prev);
        idsToApprove.forEach((id) => next.delete(id));
        return next;
      });

      // Optimistic update: instantly update status or remove approved items if viewing 'pending' filter
      setPendingQuestions((prev) => {
        if (pendingFilterStatus === 'pending') {
          return prev.filter((q) => !idsToApprove.includes(q.id));
        }
        return prev.map((q) => (idsToApprove.includes(q.id) ? { ...q, status: 'approved' } : q));
      });
      setPendingTotal((prev) => Math.max(0, prev - (pendingFilterStatus === 'pending' ? idsToApprove.length : 0)));

      // Silent background refreshes without unmounting UI
      loadProgress();
      loadStats();
      loadQuestions();
      loadPoolStats();
    } else {
      setActionErrorMsg(`Phê duyệt thất bại: ${res.error || 'Lỗi không xác định'}`);
      setTimeout(() => setActionErrorMsg(null), 5000);
    }
  };

  /**
   * Reject single or multiple pending questions
   */
  const handleRejectPending = async (idsToReject: string[], reasonNote?: string) => {
    if (idsToReject.length === 0) return;
    const isSingle = idsToReject.length === 1;
    const payload = isSingle
      ? { id: idsToReject[0], rejection_note: reasonNote }
      : { ids: idsToReject, rejection_note: reasonNote };

    setIsSubmittingReject(true);
    const res = await safeApiCall<{
      success: boolean;
      rejected_count?: number;
      rejected_ids?: string[];
    }>('/api/qbank/pending/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(() => handleRejectPending(idsToReject, reasonNote));
      setIsSubmittingReject(false);
      return;
    }

    if (res.success) {
      const count = res.data?.rejected_count ?? idsToReject.length;
      setActionSuccessMsg(`Đã từ chối ${count} câu hỏi.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);

      setSelectedPendingIds((prev) => {
        const next = new Set(prev);
        idsToReject.forEach((id) => next.delete(id));
        return next;
      });
      setIsRejectModalOpen(false);
      setRejectingPendingIds([]);
      setRejectReasonNote('');

      // Optimistic update: completely delete rejected items from view and state
      setPendingQuestions((prev) => prev.filter((q) => !idsToReject.includes(q.id)));
      setPendingTotal((prev) => Math.max(0, prev - idsToReject.length));

      // Silent background refreshes
      loadProgress();
      loadStats();
      loadQuestions();
      loadPoolStats();
    } else {
      setActionErrorMsg(`Từ chối thất bại: ${res.error || 'Lỗi không xác định'}`);
      setTimeout(() => setActionErrorMsg(null), 5000);
    }
    setIsSubmittingReject(false);
  };

  /**
   * Disable single or multiple pending questions
   */
  const handleDisablePending = async (idsToDisable: string[]) => {
    if (idsToDisable.length === 0) return;
    const isSingle = idsToDisable.length === 1;
    const payload = isSingle ? { id: idsToDisable[0] } : { ids: idsToDisable };

    const res = await safeApiCall<{
      success: boolean;
      disabled_count?: number;
      disabled_ids?: string[];
    }>('/api/qbank/pending/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(() => handleDisablePending(idsToDisable));
      return;
    }

    if (res.success) {
      const count = res.data?.disabled_count ?? idsToDisable.length;
      setActionSuccessMsg(`Đã vô hiệu hóa ${count} câu hỏi.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);

      setSelectedPendingIds((prev) => {
        const next = new Set(prev);
        idsToDisable.forEach((id) => next.delete(id));
        return next;
      });

      // Optimistic update
      setPendingQuestions((prev) => {
        if (pendingFilterStatus === 'disabled') {
          return prev.map((q) => (idsToDisable.includes(q.id) ? { ...q, status: 'disabled' } : q));
        }
        return prev.filter((q) => !idsToDisable.includes(q.id));
      });
      setPendingTotal((prev) => Math.max(0, prev - (pendingFilterStatus !== 'disabled' ? idsToDisable.length : 0)));

      // Silent background refreshes
      loadProgress();
      loadStats();
      loadQuestions();
      loadPoolStats();
    } else {
      setActionErrorMsg(`Vô hiệu hóa thất bại: ${res.error || 'Lỗi không xác định'}`);
      setTimeout(() => setActionErrorMsg(null), 5000);
    }
  };

  /**
   * Inline edit handlers for pending question card
   */
  const handleStartInlineEdit = (q: PendingQuestionItem) => {
    setEditingPendingId(q.id);
    setEditPendingStem(q.stem || '');
    setEditPendingOptions(q.options && q.options.length > 0 ? [...q.options] : []);
    setEditPendingAnswerIdx(typeof q.answer_idx === 'number' ? q.answer_idx : 0);
    setEditPendingExplanationVi(q.explanation_vi || '');
    setEditPendingPinyin(q.pinyin || '');
    setEditPendingTheme(q.illustration_theme || '');
    setEditPendingLevel(q.level || 1);
    setEditPendingError(null);
  };

  const handleCancelInlineEdit = () => {
    setEditingPendingId(null);
    setEditPendingError(null);
  };

  const handleSavePendingEdit = async (id: string) => {
    if (!editPendingStem.trim()) {
      setEditPendingError('Câu dẫn (stem) không được để trống.');
      return;
    }
    const isWritingTask =
      editPendingOptions.length === 0 ||
      (typeof editPendingStem === 'string' && /写一篇短文|写短文|写句子|书写/i.test(editPendingStem));
    if (!isWritingTask && editPendingOptions.some((opt) => !opt.trim())) {
      setEditPendingError('Tất cả phương án lựa chọn đều phải có nội dung.');
      return;
    }
    if (!editPendingExplanationVi.trim()) {
      setEditPendingError('Lời giải thích tiếng Việt không được để trống.');
      return;
    }

    setIsSavingPendingEdit(true);
    setEditPendingError(null);

    const res = await safeApiCall<{ success: boolean; question?: PendingQuestionItem }>(
      `/api/qbank/pending/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stem: editPendingStem.trim(),
          options: editPendingOptions.map((o) => o.trim()),
          answer_idx: editPendingAnswerIdx,
          explanation_vi: editPendingExplanationVi.trim(),
          pinyin: editPendingPinyin.trim() || null,
          illustration_theme: editPendingTheme.trim() || null,
          level: editPendingLevel,
        }),
      }
    );

    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(() => handleSavePendingEdit(id));
      setIsSavingPendingEdit(false);
      return;
    }

    if (res.success) {
      const updated = res.data?.question;
      if (updated) {
        setPendingQuestions((prev) => prev.map((q) => (q.id === id ? updated : q)));
      } else {
        setPendingQuestions((prev) =>
          prev.map((q) =>
            q.id === id
              ? {
                  ...q,
                  stem: editPendingStem.trim(),
                  options: editPendingOptions.map((o) => o.trim()),
                  answer_idx: editPendingAnswerIdx,
                  explanation_vi: editPendingExplanationVi.trim(),
                  pinyin: editPendingPinyin.trim() || null,
                  illustration_theme: editPendingTheme.trim() || null,
                  level: editPendingLevel,
                }
              : q
          )
        );
      }
      setEditingPendingId(null);
      setActionSuccessMsg(`Đã cập nhật câu hỏi [${id}] thành công.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } else {
      setEditPendingError(res.error || 'Lỗi khi lưu chỉnh sửa câu hỏi.');
    }
    setIsSavingPendingEdit(false);
  };

  /**
   * Alias for handleSavePendingEdit as specified in M2 requirements
   */
  const handleSaveInlineEdit = handleSavePendingEdit;

  /**
   * Question reordering handlers (DnD and WCAG accessible Up/Down buttons)
   */
  const handleMoveQuestion = (qId: string, direction: 'up' | 'down') => {
    setPendingQuestions((prev) => {
      const filtered = filteredPendingQuestions;
      const currentIdx = filtered.findIndex((q) => q.id === qId);
      if (currentIdx === -1) return prev;
      const targetFilteredIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
      if (targetFilteredIdx < 0 || targetFilteredIdx >= filtered.length) return prev;
      const targetId = filtered[targetFilteredIdx].id;

      const sourceIdx = prev.findIndex((q) => q.id === qId);
      const destIdx = prev.findIndex((q) => q.id === targetId);
      if (sourceIdx === -1 || destIdx === -1) return prev;
      return reorderArray(prev, sourceIdx, destIdx);
    });
  };

  const handleReorderQuestion = (sourceId: string, destId: string) => {
    if (sourceId === destId) return;
    setPendingQuestions((prev) => {
      const sourceIdx = prev.findIndex((q) => q.id === sourceId);
      const destIdx = prev.findIndex((q) => q.id === destId);
      if (sourceIdx === -1 || destIdx === -1) return prev;
      return reorderArray(prev, sourceIdx, destIdx);
    });
  };

  /**
   * Option reordering handlers for card view and inline edit mode
   * Strictly maintains:
   * const previousCorrectOption = currentOptions[currentAnswerIdx];
   * const nextOptions = reorder(currentOptions, sourceIdx, destIdx);
   * const nextAnswerIdx = nextOptions.indexOf(previousCorrectOption);
   */
  const handleReorderCardOptions = async (questionId: string, sourceIdx: number, destIdx: number) => {
    let updatedQuestion: PendingQuestionItem | null = null;
    setPendingQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const res = reorderOptions(q.options, q.answer_idx, sourceIdx, destIdx);
        updatedQuestion = {
          ...q,
          options: res.options,
          answer_idx: res.answer_idx,
        };
        return updatedQuestion;
      })
    );

    if (updatedQuestion) {
      // Auto-persist option order to SQLite via PUT /api/qbank/pending/:id
      await safeApiCall(`/api/qbank/pending/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          options: (updatedQuestion as PendingQuestionItem).options,
          answer_idx: (updatedQuestion as PendingQuestionItem).answer_idx,
        }),
      });
    }
  };

  const handleReorderInlineOptions = (sourceIdx: number, destIdx: number) => {
    const res = reorderOptions(editPendingOptions, editPendingAnswerIdx, sourceIdx, destIdx);
    setEditPendingOptions(res.options);
    setEditPendingAnswerIdx(res.answer_idx);
  };

  const handleSaveQuestionOrder = () => {
    try {
      const orderIds = pendingQuestions.map((q) => q.id);
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('qbank_pending_order', JSON.stringify(orderIds));
      }
    } catch {}
    setActionSuccessMsg(`Đã lưu thứ tự ${pendingQuestions.length} câu hỏi thành công.`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  /**
   * Handle AI Auto-Format (POST /api/qbank/ai-format)
   * Sử dụng mô hình Ollama qwen2.5:7b để phân tích văn bản thô đa định dạng thành JSON chuẩn
   */
  const handleAiAutoFormat = async () => {
    if (!importInputText.trim()) {
      setImportError('Vui lòng dán văn bản thô hoặc nội dung câu hỏi trước khi bấm Tự động định dạng.');
      return;
    }

    setIsAutoFormatting(true);
    setImportError(null);

    const payload = {
      raw_text: importInputText.trim(),
      default_level: importLevel,
      default_skill: importSkill,
      default_part_type: importPartType,
    };

    const res = await safeApiCall<{
      success: boolean;
      questions?: any[];
      formatted_json?: string;
      count?: number;
      message?: string;
      error?: string;
    }>('/api/qbank/ai-format', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(() => handleAiAutoFormat());
      setIsAutoFormatting(false);
      return;
    }

    if (res.success && res.data) {
      let formattedStr = '';
      if (typeof res.data.formatted_json === 'string' && res.data.formatted_json.trim()) {
        formattedStr = res.data.formatted_json.trim();
      } else if (Array.isArray(res.data.questions) && res.data.questions.length > 0) {
        formattedStr = JSON.stringify(res.data.questions, null, 2);
      } else if (Array.isArray(res.data) && res.data.length > 0) {
        formattedStr = JSON.stringify(res.data, null, 2);
      }

      if (formattedStr && formattedStr !== '[]') {
        setImportInputText(formattedStr);
        const count = res.data.count || (Array.isArray(res.data.questions) ? res.data.questions.length : 1);
        setActionSuccessMsg(`Đã tự động chuẩn hóa ${count} câu hỏi sang định dạng JSON CBT chuẩn thành công! Bạn có thể kiểm tra trước khi bấm Phân tích & Nhập.`);
        setTimeout(() => setActionSuccessMsg(null), 5000);
      } else {
        setImportError(res.data.message || 'Mô hình AI không tìm thấy câu hỏi hợp lệ để chuyển đổi. Vui lòng kiểm tra lại văn bản đầu vào.');
      }
    } else {
      setImportError(
        res.error ||
        'Quá trình tự động định dạng bằng AI thất bại. Vui lòng đảm bảo dịch vụ Ollama (qwen2.5:7b) đang chạy tại http://localhost:11434.'
      );
    }

    setIsAutoFormatting(false);
  };

  /**
   * Tạo hoặc tạo lại âm thanh nghe hiểu qua edge-tts (POST /api/qbank/tts-generate)
   */
  const handleGenerateTts = async (q: PendingQuestionItem) => {
    if (!q.id) return;

    setGeneratingAudioIds((prev) => new Set(prev).add(q.id));
    setPendingError(null);

    const listeningParts = parseListeningParts(q.stem, q.pinyin, q.part_type);
    const scriptToRead = (q as any).passage
      ? `${(q as any).passage}`
      : listeningParts.dialoguePart || (q as any).audio_script || q.stem;

    const res = await safeApiCall<{
      success: boolean;
      audio_url?: string;
      duration_s?: number;
      error?: string;
    }>('/api/qbank/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: q.id,
        audio_script: scriptToRead,
        voice: selectedTtsVoice,
        intro_chime: withIntroChime,
      }),
    });

    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(() => handleGenerateTts(q));
      setGeneratingAudioIds((prev) => {
        const next = new Set(prev);
        next.delete(q.id);
        return next;
      });
      return;
    }

    if (res.success && res.data?.audio_url) {
      const newAudioUrl = res.data.audio_url;
      // Cập nhật ngay trong local state để người dùng nghe được ngay không cần load lại trang
      setPendingQuestions((prev) =>
        prev.map((item) => (item.id === q.id ? { ...item, audio_url: newAudioUrl } : item))
      );
      setActionSuccessMsg(
        `Đã tạo file âm thanh thành công cho câu hỏi ${q.id}${
          res.data.duration_s ? ` (${res.data.duration_s.toFixed(1)}s)` : ''
        }!`
      );
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } else {
      setPendingError(res.error || 'Quá trình tạo âm thanh TTS thất bại. Vui lòng kiểm tra dịch vụ edge-tts.');
    }

    setGeneratingAudioIds((prev) => {
      const next = new Set(prev);
      next.delete(q.id);
      return next;
    });
  };

  /**
   * Handle Universal Question Import & 6 Quality Gates Evaluation
   */
  const handleImportQuestions = async () => {
    if (!importInputText.trim()) {
      setImportError('Vui lòng dán nội dung câu hỏi (JSON, văn bản thô hoặc kịch bản AI) vào ô nhập liệu.');
      return;
    }

    setIsImporting(true);
    setImportError(null);

    const payload = {
      text: importInputText.trim(),
      default_level: importLevel,
      default_skill: importSkill,
      default_part_type: importPartType,
      default_topic: importTopic.trim() || null,
    };

    const res = await safeApiCall<any>('/api/qbank/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(() => handleImportQuestions());
      setIsImporting(false);
      return;
    }

    if (res.success && res.data) {
      setImportResult(res.data);
      if (res.data.accepted_count > 0) {
        setActionSuccessMsg(`Đã nhập thành công ${res.data.accepted_count} câu hỏi đạt chuẩn 6 Cổng vào hàng chờ duyệt!`);
        setTimeout(() => setActionSuccessMsg(null), 5000);
        loadProgress();
        loadPendingQuestions();
        loadStats();

        // Milestone M3: If skill is listening and listeningScript was provided, auto-trigger TTS for inserted question
        if (importSkill === 'listening' && listeningScript.trim()) {
          const insertedItem = res.data.results?.find((r: any) => r.inserted && (r.id || r.question?.id));
          const targetQId = insertedItem?.id || insertedItem?.question?.id;
          if (targetQId) {
            try {
              const ttsRes = await safeApiCall<any>('/api/qbank/tts-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  question_id: targetQId,
                  audio_script: listeningScript.trim(),
                  voice: 'zh-CN-XiaoxiaoNeural',
                }),
              });
              if (ttsRes.success && ttsRes.data?.audio_url) {
                setActionSuccessMsg(`Đã nhập thành công ${res.data.accepted_count} câu hỏi và tự động tạo file âm thanh nghe hiểu!`);
                loadPendingQuestions();
              }
            } catch (ttsErr) {
              console.warn('[Auto TTS post-import]', ttsErr);
            }
          }
        }
      } else if (res.data.total_parsed === 0) {
        setImportError(res.data.message || 'Không tìm thấy câu hỏi hợp lệ trong văn bản đã nhập.');
      }
    } else {
      setImportError(res.error || 'Quá trình nhập và kiểm duyệt câu hỏi thất bại.');
    }

    setIsImporting(false);
  };

  /**
   * Handle File Selection with validation
   */
  const handleSelectFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowed = ['xlsx', 'xls', 'csv', 'docx', 'pdf', 'txt', 'json'];
    if (!allowed.includes(ext)) {
      setImportError(`Định dạng file .${ext} không được hỗ trợ. Vui lòng chọn file .xlsx, .xls, .csv, .docx, .pdf, .txt hoặc .json.`);
      return;
    }
    setSelectedFile(file);
    setImportError(null);
    setImportResult(null);
    setShowExtractedRawText(false);
  };

  /**
   * Handle File Upload & 6-Gate Quality Verification (POST /api/qbank/upload-file)
   */
  const handleUploadAndProcessFile = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportError(null);
    setFileProcessingStep('Đang đọc tệp tin từ thiết bị...');

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          resolve(res.includes(',') ? res.split(',')[1] : res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      setFileProcessingStep('Đang bóc tách câu hỏi, Pinyin và các lựa chọn A–E...');

      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'xlsx';
      const payload = {
        file_name: selectedFile.name,
        file_type: ext,
        file_base64: base64Data,
        default_level: importLevel,
        default_skill: importSkill,
        default_part_type: importPartType,
        default_topic: importTopic.trim() || null,
      };

      setFileProcessingStep('Đang kiểm duyệt qua 6 Cổng Chất Lượng...');

      const res = await safeApiCall<any>('/api/qbank/upload-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.statusCode === 401 || res.statusCode === 403) {
        promptTokenModal(() => handleUploadAndProcessFile());
        setIsImporting(false);
        return;
      }

      if (res.success && res.data) {
        setImportResult(res.data);
        if (res.data.accepted_count > 0) {
          setActionSuccessMsg(`Đã nạp thành công ${res.data.accepted_count} câu hỏi đạt chuẩn 6 Cổng từ file "${selectedFile.name}"!`);
          setTimeout(() => setActionSuccessMsg(null), 5000);
          loadProgress();
          loadPendingQuestions();
          loadStats();
        } else if (res.data.total_parsed === 0) {
          setImportError(res.data.message || 'Không tìm thấy câu hỏi hợp lệ trong file đã tải lên.');
        }
      } else {
        setImportError(res.error || 'Quá trình trích xuất và kiểm duyệt file thất bại.');
      }
    } catch (err: any) {
      setImportError(err.message || 'Lỗi khi đọc file trên trình duyệt.');
    } finally {
      setIsImporting(false);
      setFileProcessingStep(null);
    }
  };

  /**
   * Milestone M4: Downsample image on client canvas to <= 2048px preserving aspect ratio
   */
  const downsampleImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh'));
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (typeof window === 'undefined' || typeof Image === 'undefined') {
          resolve(result);
          return;
        }
        const img = new Image();
        img.onerror = () => resolve(result);
        img.onload = () => {
          try {
            const maxDim = 2048;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(result);
              return;
            }
            ctx.drawImage(img, 0, 0, w, h);
            const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            resolve(canvas.toDataURL(mime, 0.9));
          } catch {
            resolve(result);
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    });
  };

  /**
   * Milestone M4: Handle OCR Image Processing & Ingestion
   */
  const processOcrImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImportError('Vui lòng chọn hoặc dán tệp hình ảnh (.png, .jpeg, .webp).');
      return;
    }
    setImportError(null);
    setOcrExtractedText('');
    setOcrState('reading');
    setOcrProgressMsg('1. Đang tối ưu hình ảnh...');

    try {
      const dataUrl = await downsampleImage(file);
      setOcrPreviewImage(dataUrl);

      setOcrState('ocr');
      setOcrProgressMsg('2. Đang nhận diện chữ Hán (OCR)...');

      const res = await safeApiCall<any>('/api/qbank/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: dataUrl,
          target_level: importLevel,
          default_level: importLevel,
          default_skill: importSkill,
          default_part_type: importPartType,
          default_topic: importTopic.trim() || undefined,
          auto_parse: true,
        }),
      });

      if (res.statusCode === 401 || res.statusCode === 403) {
        promptTokenModal(() => processOcrImageFile(file));
        setOcrState('idle');
        return;
      }

      if (!res.success || !res.data) {
        setOcrState('idle');
        setImportError(res.error || 'Nhận diện hình ảnh thất bại. Hình ảnh có thể quá mờ hoặc thiếu chữ Hán.');
        return;
      }

      setOcrState('parsing');
      setOcrProgressMsg('3. Đang bóc tách câu hỏi & 6 cổng...');

      setOcrExtractedText(res.data.text || res.data.extracted_text || '');
      setImportResult(res.data);

      const count = res.data.count ?? res.data.accepted_count ?? (res.data.questions?.length || 0);

      setOcrState('done');
      setOcrProgressMsg(`4. Đã nạp thành công ${count} câu hỏi vào hàng chờ!`);

      if (count > 0) {
        setActionSuccessMsg(`Đã nhận diện OCR và nạp thành công ${count} câu hỏi đạt chuẩn vào hàng chờ duyệt!`);
        setTimeout(() => setActionSuccessMsg(null), 5000);
        loadProgress();
        loadPendingQuestions();
        loadStats();
      } else if (res.data.total_parsed === 0) {
        setImportError('Đã nhận diện văn bản nhưng không tìm thấy cấu trúc câu hỏi (A, B, C, D hoặc Bảng đáp án). Bạn có thể xem văn bản nhận diện được bên dưới.');
      }
    } catch (err: any) {
      setOcrState('idle');
      setImportError(`Lỗi khi xử lý hình ảnh OCR: ${err.message || 'Lỗi không xác định'}`);
    }
  };

  const handleOcrFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processOcrImageFile(e.target.files[0]);
    }
  };

  const handleOcrDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOcrDragging(true);
  };

  const handleOcrDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOcrDragging(false);
  };

  const handleOcrDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOcrDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processOcrImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleOcrPaste = useCallback((e: React.ClipboardEvent | ClipboardEvent) => {
    const items = (e as any).clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          processOcrImageFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  }, [importLevel, importSkill, importPartType, importTopic]);

  useEffect(() => {
    if (importMode !== 'ocr') return;
    const globalPasteListener = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      handleOcrPaste(e);
    };
    window.addEventListener('paste', globalPasteListener);
    return () => window.removeEventListener('paste', globalPasteListener);
  }, [importMode, handleOcrPaste]);

  // Real-time client-side search filtering
  const filteredQuestions = useMemo(() => {
    let list = questions;
    if (filterSkill !== 'all') {
      list = list.filter((item) => (item.skill || '').toLowerCase() === filterSkill.toLowerCase());
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((item) => {
      const matchStem = item.stem?.toLowerCase().includes(q);
      const matchPassage = item.passage?.toLowerCase().includes(q);
      const matchOptions = item.options?.some((opt) => opt?.toLowerCase().includes(q));
      const matchExplanation = item.explanation_vi?.toLowerCase().includes(q);
      const matchId = item.question_id?.toLowerCase().includes(q);
      return matchStem || matchPassage || matchOptions || matchExplanation || matchId;
    });
  }, [questions, filterSkill, searchQuery]);

  const handleStopContinuousLocalLoop = () => {
    genContinuousLoopActiveRef.current = false;
  };

  /**
   * Generation Form Submission (supports single batch or Unlimited Local GPU Continuous Auto-Loop)
   */
  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenError(null);
    setGenSummary(null);
    setActionSuccessMsg(null);

    const isLocalLoop = genProvider === 'ollama' && genContinuousLocalLoop;
    genContinuousLoopActiveRef.current = isLocalLoop;
    let totalSavedAcrossLoops = 0;
    let batchesCompleted = 0;
    setGenLoopTotalSaved(0);
    setGenLoopBatchesDone(0);

    do {
      const res = await safeApiCall<{
        success: boolean;
        status?: 'success' | 'partial' | 'all_rejected' | 'dry_run' | 'failed';
        is_dry_run?: boolean;
        saved?: boolean;
        message?: string;
        batch_id: string;
        count?: number;
        count_requested?: number;
        count_generated?: number;
        count_passed_validator?: number;
        count_saved_pending?: number;
        count_rejected_validator?: number;
        rejected_reasons?: Array<{ reason: string; count: number }>;
        validation_failures?: Array<{ candidate_index: number; error_count: number; errors: string[] }>;
        model?: string;
        error?: string;
      }>('/api/qbank/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: genLevel,
          count: genCount,
          part_type: genPartType,
          skill: genPartType.startsWith('listen_') ? 'listening' : genPartType.startsWith('write_') ? 'writing' : 'reading',
          topic: genTopic.trim() ? genTopic.trim() : undefined,
          target_grammar: genTargetGrammar.trim() ? genTargetGrammar.trim() : undefined,
          target_vocabulary: genTargetVocab.trim() ? genTargetVocab.trim() : undefined,
          lesson: genLesson.trim() ? genLesson.trim() : undefined,
          provider: genProvider !== 'auto' ? genProvider : undefined,
          use_solver: genUseSolver,
        }),
      });

      if (res.statusCode === 401 || res.statusCode === 403) {
        genContinuousLoopActiveRef.current = false;
        promptTokenModal(() => handleGenerateSubmit(e));
        setIsGenerating(false);
        return;
      }

      if (!res.success) {
        genContinuousLoopActiveRef.current = false;
        setGenError(res.error || res.data?.message || 'Tiến trình sinh đề gặp lỗi.');
        if (res.data && res.data.status === 'all_rejected') {
          const rejectedCount = res.data.count_rejected_validator ?? 0;
          setGenSummary({
            batch_id: res.data.batch_id,
            count: 0,
            savedCount: 0,
            rejectedCount,
            generatedCount: res.data.count_generated ?? rejectedCount,
            passedCount: 0,
            status: 'all_rejected',
            isDryRun: Boolean(res.data.is_dry_run),
            model: res.data.model || 'Groq Cloud / Gemini / Ollama',
            message: res.data.message || res.data.error,
            rejectedReasons: res.data.rejected_reasons,
            failures: res.data.validation_failures,
          });
        } else {
          setGenSummary(null);
        }
        break;
      } else if (res.data) {
        const savedCount = res.data.count_saved_pending ?? res.data.count ?? 0;
        const rejectedCount = res.data.count_rejected_validator ?? 0;
        const isDryRun = Boolean(res.data.is_dry_run);
        const status = res.data.status || (isDryRun ? 'dry_run' : savedCount > 0 ? (rejectedCount === 0 ? 'success' : 'partial') : 'all_rejected');

        batchesCompleted++;
        totalSavedAcrossLoops += savedCount;
        setGenLoopBatchesDone(batchesCompleted);
        setGenLoopTotalSaved(totalSavedAcrossLoops);

        setGenSummary({
          batch_id: res.data.batch_id,
          count: savedCount,
          savedCount,
          rejectedCount,
          generatedCount: res.data.count_generated ?? (savedCount + rejectedCount),
          passedCount: res.data.count_passed_validator ?? savedCount,
          status,
          isDryRun,
          model: res.data.model || 'Groq Cloud / Gemini / Ollama',
          message: isLocalLoop
            ? `[Chế độ Card Local Liên Tục: Đợt #${batchesCompleted} • Đã lưu tổng cộng ${totalSavedAcrossLoops} câu] ${res.data.message || ''}`
            : res.data.message || res.data.error,
          rejectedReasons: res.data.rejected_reasons,
          failures: res.data.validation_failures,
        });

        // Refresh stats & question list ONLY when questions were actually persisted
        if (savedCount > 0) {
          loadStats();
          loadQuestions();
          loadPendingQuestions();
          loadProgress();
          loadPoolStats();
        }
      } else {
        genContinuousLoopActiveRef.current = false;
        setGenError(res.error || 'Tiến trình sinh đề gặp lỗi không xác định.');
        setGenSummary(null);
        break;
      }

      if (genContinuousLoopActiveRef.current) {
        await new Promise((r) => setTimeout(r, 800));
      }
    } while (genContinuousLoopActiveRef.current);

    genContinuousLoopActiveRef.current = false;
    setIsGenerating(false);
  };

  /**
   * Review Status Actions (Approve / Reject)
   */
  const handleStatusChange = async (
    questionId: string,
    action: 'approve' | 'reject',
    overrideReason?: string
  ) => {
    const res = await safeApiCall<{ success: boolean; question_id: string; status: string }>(
      '/api/qbank/review',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          action,
          override_reason: overrideReason,
        }),
      }
    );

    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(() => handleStatusChange(questionId, action, overrideReason));
      return;
    }

    if (res.success && res.data) {
      if (action === 'reject') {
        setQuestions((prev) => prev.filter((q) => q.question_id !== questionId));
        setActionSuccessMsg(`Đã từ chối và xóa câu hỏi [${questionId}].`);
      } else {
        setQuestions((prev) =>
          prev.map((q) => (q.question_id === questionId ? { ...q, status: 'approved' } : q))
        );
        setActionSuccessMsg(`Đã phê duyệt câu hỏi [${questionId}] thành công.`);
      }
      setTimeout(() => setActionSuccessMsg(null), 4000);
      loadStats();
    } else {
      setActionErrorMsg(`Thao tác thất bại: ${res.error || 'Lỗi không xác định'}`);
      setTimeout(() => setActionErrorMsg(null), 5000);
    }
  };

  /**
   * Phát chuông báo hiệu dạo nhẹ nhàng 1.2s trước hội thoại bằng Web Audio API
   */
  const playIntroChime = (): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
          setTimeout(resolve, 800);
          return;
        }
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        // Âm 1: Sol 5 (G5 - 784 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(784, now);
        gain1.gain.setValueAtTime(0.22, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 1.0);

        // Âm 2: Đô 6 (C6 - 1046.5 Hz) - Gõ chuông tiếp nối êm dịu
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046.5, now + 0.15);
        gain2.gain.setValueAtTime(0.18, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.15);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.15);
        osc2.stop(now + 1.15);

        setTimeout(() => {
          try { ctx.close(); } catch {}
          resolve();
        }, 1200);
      } catch {
        setTimeout(resolve, 800);
      }
    });
  };

  /**
   * Phát âm thanh tiếng Trung qua Web Speech Synthesis có chuông dạo 1.2s trước khi đọc
   */
  const handlePlayWebSpeech = async (text: string, questionId?: string) => {
    if (typeof window === 'undefined') return;
    if (questionId) setIsPlayingWebSpeechId(questionId);

    if (withIntroChime) {
      await playIntroChime();
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text
        .replace(/^(?:男|女|爸爸|妈妈|小明|老师|A|B)\s*[:：]/gm, '')
        .trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;

      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find((v) => v.lang.startsWith('zh'));
      if (zhVoice) utterance.voice = zhVoice;

      utterance.onend = () => setIsPlayingWebSpeechId(null);
      utterance.onerror = () => setIsPlayingWebSpeechId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingWebSpeechId(null);
    }
  };

  /**
   * Nghe thử phát âm mẫu của giọng đọc AI đã chọn (Voice Audition Preview)
   */
  const handleAuditionVoice = async (voiceId: string, questionId?: string) => {
    if (typeof window === 'undefined') return;
    const activeKey = questionId || voiceId;
    setIsAuditioningVoiceId(activeKey);

    if (withIntroChime) {
      await playIntroChime();
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const sampleText = '你好，这是普通话发音测试。';
      const utterance = new SpeechSynthesisUtterance(sampleText);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.88;

      const isFemale = /Xiao|Female|Nữ|Xiaoxiao|Xiaoyi|Xiaobei|Xiaoni/i.test(voiceId);
      const isMale = /Yun|Male|Nam|Yunxi|Yunjian|Yunyang|Yunxia/i.test(voiceId);
      utterance.pitch = isFemale ? 1.15 : isMale ? 0.88 : 1.0;

      const voices = window.speechSynthesis.getVoices();
      const voiceKey = voiceId.replace(/^zh-CN-/, '').replace(/Neural$/, '').toLowerCase();
      const matchedVoice =
        voices.find((v) => v.lang.startsWith('zh') && v.name.toLowerCase().includes(voiceKey)) ||
        voices.find((v) => v.lang.startsWith('zh'));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => setIsAuditioningVoiceId(null);
      utterance.onerror = () => setIsAuditioningVoiceId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsAuditioningVoiceId(null);
    }
  };

  /**
   * Tạo âm thanh TTS qua edge-tts cho câu hỏi trong Kho câu hỏi chính (POST /api/qbank/tts/generate)
   */
  const handleGenerateTtsForQb = async (q: QbQuestionItem) => {
    if (!q.question_id) return;

    setGeneratingAudioIds((prev) => new Set(prev).add(q.question_id));
    setQuestionsError(null);

    const listeningParts = parseListeningParts(q.stem, q.pinyin_stem, q.part_type);
    const scriptToRead = q.passage || listeningParts.dialoguePart || q.stem;

    const res = await safeApiCall<{
      success: boolean;
      audio_url?: string;
      duration_s?: number;
      error?: string;
    }>('/api/qbank/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: q.question_id,
        audio_script: scriptToRead,
        voice: selectedTtsVoice,
        intro_chime: withIntroChime,
      }),
    });

    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(() => handleGenerateTtsForQb(q));
      setGeneratingAudioIds((prev) => {
        const next = new Set(prev);
        next.delete(q.question_id);
        return next;
      });
      return;
    }

    if (res.success && res.data?.audio_url) {
      const newAudioUrl = res.data.audio_url;
      setQuestions((prev) =>
        prev.map((item) => (item.question_id === q.question_id ? { ...item, audio_url: newAudioUrl } : item))
      );
      setActionSuccessMsg(
        `Đã tạo file âm thanh thành công cho câu hỏi ${q.question_id}${
          res.data.duration_s ? ` (${res.data.duration_s.toFixed(1)}s)` : ''
        }!`
      );
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } else {
      setQuestionsError(res.error || 'Quá trình tạo âm thanh TTS thất bại. Vui lòng kiểm tra dịch vụ edge-tts.');
    }

    setGeneratingAudioIds((prev) => {
      const next = new Set(prev);
      next.delete(q.question_id);
      return next;
    });
  };

  /**
   * Open Edit Modal
   */
  const handleOpenEdit = (q: QbQuestionItem) => {
    setEditingQuestion(q);
    setEditStem(q.stem || '');
    setEditOptions(q.options && q.options.length === 4 ? [...q.options] : ['', '', '', '']);
    setEditAnswerIndex(typeof q.answer_index === 'number' ? q.answer_index : 0);
    setEditExplanation(q.explanation_vi || '');
    setEditLevel(q.level || 1);
    setEditError(null);
  };

  /**
   * Save Question Edit
   */
  const handleSaveEdit = async () => {
    if (!editingQuestion) return;

    if (!editStem.trim()) {
      setEditError('Câu dẫn (stem) không được để trống.');
      return;
    }
    if (editOptions.some((opt) => !opt.trim())) {
      setEditError('Cả 4 phương án A, B, C, D đều phải có nội dung.');
      return;
    }
    if (!editExplanation.trim()) {
      setEditError('Lời giải thích tiếng Việt không được để trống.');
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);

    const res = await safeApiCall<{
      success: boolean;
      question_id: string;
      status: string;
      question?: QbQuestionItem;
      updated_question?: QbQuestionItem;
    }>('/api/qbank/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: editingQuestion.question_id,
        action: 'edit',
        stem: editStem.trim(),
        options: editOptions.map((o) => o.trim()),
        answer_index: editAnswerIndex,
        explanation_vi: editExplanation.trim(),
        level: editLevel,
      }),
    });

    if (res.statusCode === 401 || res.statusCode === 403) {
      promptTokenModal(handleSaveEdit);
      setIsSavingEdit(false);
      return;
    }

    if (res.success && res.data) {
      const updated = res.data.question || res.data.updated_question;
      if (updated) {
        setQuestions((prev) =>
          prev.map((q) => (q.question_id === editingQuestion.question_id ? updated : q))
        );
      } else {
        // Fallback local update
        setQuestions((prev) =>
          prev.map((q) =>
            q.question_id === editingQuestion.question_id
              ? {
                  ...q,
                  stem: editStem.trim(),
                  options: editOptions.map((o) => o.trim()),
                  answer_index: editAnswerIndex,
                  explanation_vi: editExplanation.trim(),
                  level: editLevel,
                }
              : q
          )
        );
      }
      setEditingQuestion(null);
      setActionSuccessMsg(`Đã cập nhật nội dung câu hỏi [${editingQuestion.question_id}] thành công.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      loadStats();
    } else {
      setEditError(res.error || 'Lỗi khi lưu chỉnh sửa câu hỏi.');
    }
    setIsSavingEdit(false);
  };

  // Helper counts
  const approvedCount = stats?.by_status?.approved ?? 0;
  const needsReviewCount = (stats?.by_status?.needs_review ?? 0) + (stats?.by_status?.pending ?? 0);
  const rejectedCount = stats?.by_status?.rejected ?? 0;
  const totalCount = stats?.total_questions ?? stats?.total ?? (approvedCount + needsReviewCount + rejectedCount);
  const eligibleSyncCount = stats?.eligible_for_sync ?? approvedCount;

  // Instant CBT Mode: Launch custom/imported exam directly in HSKMockExam
  if (activeCbtExamSet) {
    return (
      <div className="w-full min-h-screen bg-[var(--color-background)]" data-testid="instant-cbt-exam-wrapper">
        <div className="bg-teal-900 text-white px-4 py-2.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
            <Play className="w-4 h-4 text-teal-300" />
            <span>Phòng Thi Trên Máy (Instant CBT): {activeCbtExamSet.title} • HSK {activeCbtExamSet.level} ({activeCbtExamSet.questions.length} câu)</span>
          </div>
          <button
            type="button"
            data-testid="btn-exit-instant-cbt"
            onClick={() => setActiveCbtExamSet(null)}
            className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            ← Quay lại Nhập Đề & Kho Đề
          </button>
        </div>
        <HSKMockExam
          initialMode="mock"
          initialLevel={activeCbtExamSet.level}
          customExamData={activeCbtExamSet}
          onExit={() => setActiveCbtExamSet(null)}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[var(--color-background)] text-[var(--color-text-primary)] pb-16">
      {/* Top Banner / Header */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold font-serif text-[var(--color-text-primary)]">
                    Ngân Hàng Câu Hỏi HSK 3.0
                  </h1>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 max-w-3xl">
                    Duyệt câu hỏi, soạn đề thi thử và luyện kỹ năng cho học viên.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                data-testid="btn-open-golden-prompts"
                onClick={() => setIsGoldenPromptsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer shadow-xs"
                title="Mở Thư viện Prompt Chuẩn Vàng HSK 1-6"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>✨ Thư viện Prompt Chuẩn Vàng</span>
              </button>
              <button
                type="button"
                onClick={() => promptTokenModal()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-primary)] transition-all cursor-pointer"
                title="Cài đặt mã bảo vệ quản trị (Token)"
              >
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Mã Token</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  loadStats();
                  loadQuestions();
                  loadPendingQuestions();
                }}
                disabled={statsLoading || questionsLoading || pendingLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-primary)] transition-all cursor-pointer disabled:opacity-50"
                title="Tải lại dữ liệu mới nhất"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${statsLoading || questionsLoading || pendingLoading ? 'animate-spin' : ''}`}
                />
                <span className="hidden sm:inline">Làm mới</span>
              </button>

              <button
                type="button"
                onClick={handleOpenSyncModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white shadow-xs transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Khôi phục đồng bộ ({eligibleSyncCount})</span>
              </button>
            </div>
          </div>

          {/* Sub-Tabs Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 mt-6 pt-4 border-t border-[var(--color-border)]/60 overflow-x-auto pb-1">
            <button
              type="button"
              data-testid="subtab-duyet-de"
              data-active={activeSubTab === 'duyet_de'}
              onClick={() => {
                setHasUserSwitchedTab(true);
                setActiveSubTab('duyet_de');
                loadProgress();
                loadPendingQuestions();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 silk-pill ${
                activeSubTab === 'duyet_de'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm ring-2 ring-[var(--color-primary)]/20'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" data-testid="subtab-duyet-de-icon" />
              <span>Duyệt câu mới</span>
              {totalPendingCount > 0 ? (
                <span
                  data-testid="badge-pending-count"
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    activeSubTab === 'duyet_de' ? 'bg-white/25 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  {totalPendingCount}
                </span>
              ) : (
                <span className="text-[10px] opacity-75">(0)</span>
              )}
            </button>

            <button
              type="button"
              data-testid="subtab-review"
              data-active={activeSubTab === 'review'}
              onClick={() => {
                setHasUserSwitchedTab(true);
                setActiveSubTab('review');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 silk-pill ${
                activeSubTab === 'review'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm ring-2 ring-[var(--color-primary)]/20'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Kho câu hỏi chính ({totalCount || totalQuestionsCount})</span>
            </button>

            <button
              type="button"
              data-testid="subtab-generate"
              data-active={activeSubTab === 'generate'}
              onClick={() => {
                setHasUserSwitchedTab(true);
                setActiveSubTab('generate');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 silk-pill ${
                activeSubTab === 'generate'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm ring-2 ring-[var(--color-primary)]/20'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Tạo câu hỏi AI</span>
            </button>

            <button
              type="button"
              data-testid="subtab-import"
              data-active={activeSubTab === 'import'}
              onClick={() => {
                setHasUserSwitchedTab(true);
                setActiveSubTab('import');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 silk-pill ${
                activeSubTab === 'import'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm ring-2 ring-[var(--color-primary)]/20'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Nhập đề đa nguồn</span>
            </button>

            <button
              type="button"
              data-testid="subtab-studio"
              data-active={activeSubTab === 'studio'}
              onClick={() => {
                setHasUserSwitchedTab(true);
                setActiveSubTab('studio');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 silk-pill ${
                activeSubTab === 'studio'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm ring-2 ring-purple-500/20'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Soạn đề thi mẫu (Studio 8 bước)</span>
            </button>

            <button
              type="button"
              data-testid="subtab-sync"
              data-active={activeSubTab === 'sync'}
              onClick={() => {
                setHasUserSwitchedTab(true);
                setActiveSubTab('sync');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 silk-pill ${
                activeSubTab === 'sync'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm ring-2 ring-[var(--color-primary)]/20'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Trạng thái đồng bộ & Khôi phục</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Quick 3-Step Guide — collapsed by default, hidden on the review workbench */}
        {activeSubTab !== 'duyet_de' ? (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 border border-indigo-500/20 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                  Quy trình 3 bước dễ dàng cho giáo viên & quản lý
                </h3>
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  Hệ thống tự động vận hành, bạn chỉ cần xem lại nội dung trước khi xuất bản cho học viên.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickGuide(!showQuickGuide)}
              className="text-[11px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-surface)] px-2.5 py-1 rounded-full border border-[var(--color-border)] cursor-pointer self-start sm:self-auto"
            >
              {showQuickGuide ? 'Thu gọn hướng dẫn ▴' : 'Xem hướng dẫn ▾'}
            </button>
          </div>

          {showQuickGuide && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 animate-in fade-in">
              <div className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--color-text-primary)]">AI Tự Động Sinh Đề</p>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                    Robot chạy ngầm mỗi 2h hoặc bạn bấm vào tab <strong>"Tạo câu hỏi AI"</strong> để sinh câu hỏi theo chủ đề mong muốn.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--color-text-primary)]">Xem & Duyệt Nhanh</p>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                    Vào tab <strong>"Duyệt câu mới"</strong>, kiểm tra câu chữ tiếng Trung và bấm nút <strong className="text-emerald-600">✓ Phê duyệt</strong> (hoặc sửa lời giải).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--color-text-primary)]">Học Viên Luyện Tập</p>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                    Câu hỏi đã duyệt sẽ tự động phân loại vào phần Luyện tập và Đề thi thử HSK cho học viên trên web.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        ) : null}
        {/* Global Action Success Toast */}
        {actionSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccessMsg(null)}
              className="p-1 hover:bg-emerald-500/20 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Global Action Error Toast */}
        {actionErrorMsg && (
          <div
            data-testid="global-action-error-toast"
            className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs animate-in fade-in"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{actionErrorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionErrorMsg(null)}
              className="p-1 hover:bg-rose-500/20 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Global Stats & Coverage — keep off the review workbench so questions stay on screen */}
        {activeSubTab !== 'duyet_de' ? (
        <section aria-label="Dashboard Stats" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Total */}
            <div
              onClick={() => {
                setFilterStatus('all');
                setActiveSubTab('review');
              }}
              className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex items-center justify-between cursor-pointer hover:border-indigo-500/40 transition-all"
              title="Xem tất cả câu hỏi trong kho"
            >
              <div>
                <p className="text-[11px] sm:text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Tổng câu hỏi
                </p>
                <p className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)] mt-1">
                  {totalCount}
                </p>
                <p className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Kho dữ liệu qbank.db
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: Approved */}
            <div
              onClick={() => {
                setFilterStatus('approved');
                setActiveSubTab('review');
              }}
              className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-500/40 transition-all"
              title="Xem các câu hỏi đã phê duyệt"
            >
              <div>
                <p className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Đã phê duyệt
                </p>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {approvedCount}
                </p>
                <p className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Sẵn sàng nạp vào thi thử
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Needs Review */}
            <div
              onClick={() => {
                setFilterStatus('needs_review');
                setActiveSubTab('review');
              }}
              className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-500/40 transition-all"
              title="Xem các câu cần xem xét"
            >
              <div>
                <p className="text-[11px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Cần xem xét
                </p>
                <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {needsReviewCount}
                </p>
                <p className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Chờ giáo viên duyệt
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            {/* Card 4: Rejected */}
            <div
              onClick={() => {
                setFilterStatus('rejected');
                setActiveSubTab('review');
              }}
              className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex items-center justify-between cursor-pointer hover:border-rose-500/40 transition-all"
              title="Xem các câu bị từ chối"
            >
              <div>
                <p className="text-[11px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Bị từ chối
                </p>
                <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  {rejectedCount}
                </p>
                <p className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Không nạp vào đề thi
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Quality Flags Notice Banner */}
          {stats?.flags_summary && stats.flags_summary.total_with_flags ? (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>
                  Phát hiện <strong>{stats.flags_summary.total_with_flags}</strong> câu có cờ cảnh báo chất lượng (Đa nghĩa Solver: {stats.flags_summary.solver_ambiguity || 0}, Chữ nhiễu: {stats.flags_summary.char_noise || 0}, Ngoài cấp: {stats.flags_summary.out_of_level || 0}).
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterStatus('needs_review');
                  setActiveSubTab('review');
                }}
                className="underline font-bold text-xs shrink-0 cursor-pointer hover:opacity-80"
              >
                Xem chi tiết
              </button>
            </div>
          ) : null}
        </section>
        ) : null}

        {/* VIEW 0: APPROVAL WORKFLOW & PROGRESS TRACKING (DUYET DE) */}
        {activeSubTab === 'duyet_de' && (
          <section aria-label="Approval Workflow and Progress Tracking" className="space-y-6">
            {/* Compact workbench header — questions first, not dashboard copy */}
            <div
              id="pending-questions-workbench"
              className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                    Duyệt câu hỏi
                    {totalPendingCount > 0 ? (
                      <span className="ml-2 text-amber-600 dark:text-amber-400 font-black">{totalPendingCount}</span>
                    ) : null}
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Đọc nội dung từng câu bên dưới rồi phê duyệt hoặc từ chối. Câu đã duyệt sẽ vào Luyện tập.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs">
                    <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">Nguồn AI:</span>
                    <select
                      value={schedulerStatus?.preferredProvider || 'auto'}
                      onChange={(e) =>
                        handleUpdateSchedulerConfig({
                          preferredProvider: e.target.value as 'auto' | 'ollama' | 'gemini' | 'groq' | 'deepseek',
                        })
                      }
                      disabled={schedulerActionLoading}
                      aria-label="Chọn nguồn AI sinh câu hỏi tự động"
                      className="bg-transparent text-xs font-bold text-[var(--color-text-primary)] focus:outline-none cursor-pointer"
                    >
                      <option value="auto">Tự động (Waterfall)</option>
                      <option value="gemini">Gemini</option>
                      <option value="groq">Groq Cloud</option>
                      <option value="deepseek">DeepSeek</option>
                      <option value="ollama">Ollama (Local)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleScheduler}
                    disabled={schedulerActionLoading}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      schedulerStatus?.enabled
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/25'
                        : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                    }`}
                    title={schedulerStatus?.enabled ? 'Bấm để tắt robot tự động sinh đề' : 'Bấm để bật robot tự động sinh đề'}
                  >
                    <div className={`w-2 h-2 rounded-full ${schedulerStatus?.enabled ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                    <span>{schedulerStatus?.enabled ? '🤖 Robot: ĐANG BẬT' : '🤖 Robot: ĐANG TẮT'}</span>
                  </button>
                  <button
                    type="button"
                    data-testid="btn-refresh-progress"
                    onClick={() => {
                      loadProgress();
                      loadPendingQuestions();
                      loadPoolStats();
                      loadSchedulerStatus();
                    }}
                    disabled={progressLoading || pendingLoading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${progressLoading || pendingLoading ? 'animate-spin' : ''}`}
                    />
                    <span>Làm mới</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOpsDashboard(!showOpsDashboard)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>{showOpsDashboard ? 'Ẩn thống kê' : 'Thống kê kho đề'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showOpsDashboard ? 'rotate-180' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !showBlueprintModal;
                      setShowBlueprintModal(next);
                      if (next) {
                        loadBlueprintReport();
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      showBlueprintModal
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                    }`}
                    title="Xem bảng thống kê thiếu hụt câu hỏi theo Blueprint đề thi và tự động bù"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cân Bằng Blueprint HSK</span>
                  </button>
                </div>
              </div>

              {/* Blueprint Balancer Panel */}
              {showBlueprintModal && (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Bảng Thống Kê & Tự Động Cân Bằng Đề Thi HSK 3.0 (Blueprint Quota)</span>
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        Chuẩn 1 bộ đề trọn vẹn HSK 1–6 gồm 411 câu (đầy đủ các phần Nghe, Đọc, Viết chuẩn 连词成句). Bấm nút dưới để AI tự động bù đúng phần kỹ năng bị thiếu.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRunBalancer()}
                        disabled={balancingTarget !== null}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {balancingTarget === 'all' ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang bù tuần tự các cấp...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>⚡ Tự Động Bù Mọi Cấp Độ Thiếu</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {balanceMsg && (
                    <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-semibold">
                      {balanceMsg}
                    </div>
                  )}

                  {/* Grid of HSK Levels */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((lvl) => {
                      const lvlData = blueprintReport?.levels?.[String(lvl)];
                      const isComplete = lvlData?.is_complete;
                      const deficit = lvlData?.total_deficit ?? 0;
                      return (
                        <div
                          key={lvl}
                          className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[var(--color-text-primary)]">
                              HSK {lvl} (Chuẩn: {lvlData?.total_target ?? 0} câu)
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                isComplete
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {isComplete ? '✅ Đủ chuẩn' : `⚠️ Thiếu ${deficit} câu`}
                            </span>
                          </div>

                          <div className="space-y-1 text-[11px] text-[var(--color-text-secondary)]">
                            {lvlData?.skills &&
                              Object.entries(lvlData.skills).map(([sk, sInfo]: [string, any]) => (
                                <div key={sk} className="flex justify-between items-center">
                                  <span className="capitalize">{sk === 'listening' ? 'Nghe' : sk === 'reading' ? 'Đọc' : 'Viết'}:</span>
                                  <span className={sInfo.is_met ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-bold'}>
                                    {sInfo.current} / {sInfo.target} {sInfo.is_met ? '✓' : `(thiếu ${sInfo.deficit})`}
                                  </span>
                                </div>
                              ))}
                          </div>

                          {!isComplete && (
                            <button
                              type="button"
                              onClick={() => handleRunBalancer(lvl)}
                              disabled={balancingTarget !== null}
                              className="w-full mt-1 py-1.5 px-3 rounded-lg bg-[var(--color-background)] border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                            >
                              {activeBalancingLevel === lvl ? (
                                <span className="flex items-center justify-center gap-1.5">
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>Đang bù HSK {lvl}...</span>
                                </span>
                              ) : balancingTarget === 'all' ? (
                                <span>Chờ lượt...</span>
                              ) : (
                                `Bù 3 câu cho HSK ${lvl}`
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPendingFilterLevel('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    pendingFilterLevel === 'all'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  Tất cả · {totalPendingCount}
                </button>
                {[1, 2, 3, 4, 5, 6].map((lvl) => {
                  const pCount = progress?.pending_by_level?.[String(lvl)] ?? 0;
                  const isSelected = pendingFilterLevel === String(lvl);
                  return (
                    <button
                      key={lvl}
                      type="button"
                      data-testid={`kpi-card-pending-${lvl}`}
                      onClick={() => setPendingFilterLevel(isSelected ? 'all' : String(lvl))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      HSK {lvl}
                      <span className={`ml-1.5 font-mono ${pCount > 0 && !isSelected ? 'text-amber-600' : ''}`}>
                        {pCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Banners */}
            {progressError && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>{progressError}</span>
                </div>
                <button
                  type="button"
                  onClick={loadProgress}
                  className="underline font-bold text-xs cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            )}

            {showOpsDashboard ? (
            <div className="space-y-4">
              {/* Part 2: Saturation progress bars (HSK 1: X/40, HSK 2: X/60, HSK 3: X/80, HSK 4: X/70, HSK 5: X/120) */}
              <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                      Độ Bão Hòa Câu Hỏi Đã Phê Duyệt (Approved Saturation)
                    </h3>
                  </div>
                  <span
                    data-testid="text-total-approved-count"
                    className="text-xs text-[var(--color-text-secondary)] font-medium"
                  >
                    Tổng câu đã duyệt:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {progress?.total_approved ?? approvedCount}
                    </strong>{' '}
                    câu
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
                  {[1, 2, 3, 4, 5, 6].map((lvl) => {
                    const lvlData = blueprintReport?.levels?.[String(lvl)];
                    const target = lvlData?.total_target ?? (lvl === 1 ? 40 : lvl === 2 ? 60 : lvl === 3 ? 70 : lvl === 4 ? 79 : lvl === 5 ? 80 : 82);
                    const appCount = progress?.approved_by_level?.[String(lvl)] ?? 0;
                    const isComplete = lvlData ? Boolean(lvlData.is_complete) : appCount >= target;
                    const deficit = lvlData?.total_deficit ?? Math.max(0, target - appCount);
                    const percent = isComplete ? 100 : Math.min(99, Math.round((Math.max(0, target - deficit) / target) * 100));

                    return (
                      <div
                        key={lvl}
                        data-testid={`kpi-saturation-card-${lvl}`}
                        className="p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]/70 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[var(--color-text-primary)]">
                            HSK {lvl}
                          </span>
                          <span
                            className={`text-[11px] font-bold ${
                              isComplete
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {appCount}/{target} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                          <div
                            data-testid={`saturation-bar-fill-${lvl}`}
                            className={`h-full transition-all duration-500 ${
                              isComplete
                                ? 'bg-emerald-500'
                                : 'bg-gradient-to-r from-amber-500 to-amber-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[var(--color-text-secondary)]">
                          <span>
                            {isComplete
                              ? '✓ Đủ chuẩn 1 bộ đề (mọi kỹ năng)'
                              : `⚠️ Chưa cân bằng (Thiếu ${deficit} câu)`}
                          </span>
                          <span className="font-semibold">{target} câu chuẩn</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Part 3: Recent generation history banner */}
              {(() => {
                const latest =
                  progress?.generation_history && progress.generation_history.length > 0
                    ? progress.generation_history[0]
                    : null;

                if (!latest) {
                  return (
                    <div
                      data-testid="card-latest-generation-history"
                      className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] flex items-center justify-between shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span data-testid="history-empty-placeholder">
                          Chưa ghi nhận lịch sử phiên sinh đề gần đây từ CLI hoặc Waterfall engine.
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--color-primary)]">
                        Sẵn sàng sinh mới
                      </span>
                    </div>
                  );
                }

                const countGen = latest.count_generated ?? latest.count_requested ?? 0;
                const dateStr =
                  latest.created_at || latest.timestamp
                    ? parseUtcDate(latest.created_at || latest.timestamp).toLocaleString('vi-VN')
                    : 'Vừa xong';

                return (
                  <div
                    data-testid="card-latest-generation-history"
                    className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-500/20 text-xs sm:text-sm space-y-2 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <span>Lịch sử sinh đề gần nhất:</span>
                        <code
                          data-testid="history-batch-id"
                          className="px-2 py-0.5 rounded-md bg-indigo-500/20 font-mono text-xs text-[var(--color-text-primary)]"
                        >
                          {latest.batch_id}
                        </code>
                      </div>
                      <span
                        data-testid="history-batch-status"
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          latest.status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {latest.status === 'success' ? 'Thành công' : latest.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                      <span>
                        Thời gian: <strong className="text-[var(--color-text-primary)]">{dateStr}</strong>
                      </span>
                      <span>
                        Số câu sinh:{' '}
                        <strong
                          data-testid="history-generated-count"
                          className="text-[var(--color-text-primary)]"
                        >
                          {countGen} câu
                        </strong>
                      </span>
                      <span>
                        Provider:{' '}
                        <strong
                          data-testid="history-provider-used"
                          className="text-[var(--color-primary)]"
                        >
                          {latest.provider_used}
                        </strong>
                      </span>
                      {latest.model_name && (
                        <span>
                          Model: <code className="text-[11px] font-mono">{latest.model_name}</code>
                        </span>
                      )}
                      {latest.level && (
                        <span>
                          Cấp độ: <strong>HSK {latest.level}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Part 4: Hai Luồng Khai Thác Câu Hỏi (Two-Flow Architecture) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Luồng 1: Luyện tập căn bản */}
                <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                        Luồng 1 — Luyện Tập Căn Bản
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {poolStats?.total_practice ?? 0} câu khả dụng
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    Luyện tập kỹ năng (Nghe, Đọc, Viết) theo từng dạng bài, chủ đề. Câu hỏi được tự động đưa vào kho khi đã duyệt mà không cần ghép đề.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5, 6].map((lvl) => (
                      <span key={lvl} className="px-2 py-0.5 rounded bg-[var(--color-background)] border border-[var(--color-border)] text-[10px] text-[var(--color-text-secondary)]">
                        HSK {lvl}: <strong className="text-[var(--color-text-primary)]">{poolStats?.practice_by_level?.[String(lvl)] ?? 0}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Luồng 2: Luyện đề chuẩn HSK */}
                <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                        Luồng 2 — Luyện Đề Chuẩn Format HSK
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {poolStats?.total_exam_eligible ?? 0} câu chuẩn đề
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    Tương thích 100% blueprint HSK 1–6 (đúng part type, audio text, ảnh SVG, số phương án). Tự động phân loại ngay khi duyệt mà không cần giáo viên duyệt lại.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5, 6].map((lvl) => (
                      <span key={lvl} className="px-2 py-0.5 rounded bg-[var(--color-background)] border border-[var(--color-border)] text-[10px] text-[var(--color-text-secondary)]">
                        HSK {lvl}: <strong className="text-emerald-600 dark:text-emerald-400">{poolStats?.exam_eligible_by_level?.[String(lvl)] ?? 0}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Part 5: Robot Auto Question Scheduler Panel */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-500/5 via-[var(--color-surface)] to-blue-500/5 border border-emerald-500/20 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="relative mt-1">
                      <div className={`w-3.5 h-3.5 rounded-full ${schedulerStatus?.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {schedulerStatus?.enabled && (
                        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                          Robot Tự Động Sinh Câu Hỏi Nền (HSK 3.0)
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          schedulerStatus?.enabled
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {schedulerStatus?.enabled ? 'Đang hoạt động' : 'Đang tạm dừng'}
                        </span>
                        {(schedulerStatus?.preferredProvider === 'ollama' || schedulerStatus?.unlimitedDaily || (schedulerStatus?.maxQuestionsPerDay ?? 20) <= 0) && (
                          <span
                            data-testid="badge-scheduler-unlimited-local"
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30"
                          >
                            🖥️ Card Local (Ollama) • ♾️ Không giới hạn ngày
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 max-w-2xl leading-relaxed">
                        Hệ thống tự động kích hoạt AI mỗi{' '}
                        <strong>
                          {(schedulerStatus?.intervalHours ?? 2) < 1
                            ? `${Math.max(1, Math.round((schedulerStatus?.intervalHours ?? 2) * 60))} phút`
                            : `${schedulerStatus?.intervalHours ?? 2} giờ`}
                        </strong>{' '}
                        để tạo thêm <strong>{schedulerStatus?.batchSize ?? 3} câu hỏi mới</strong>. Câu hỏi sau khi sinh sẽ được đưa ngay vào mục <em>"Duyệt câu mới"</em> bên dưới để bạn duyệt.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-auto">
                    <button
                      type="button"
                      data-testid="btn-trigger-scheduler-batch"
                      onClick={handleTriggerSchedulerBatch}
                      disabled={schedulerActionLoading || schedulerStatus?.isRunning}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      title={`Yêu cầu AI sinh ngay 1 đợt ${schedulerStatus?.batchSize ?? 3} câu hỏi mới`}
                    >
                      <Zap className={`w-4 h-4 ${schedulerActionLoading || schedulerStatus?.isRunning ? 'animate-spin' : ''}`} />
                      <span>{schedulerStatus?.isRunning ? 'Đang tạo câu...' : `⚡ Sinh ngay ${schedulerStatus?.batchSize ?? 3} câu`}</span>
                    </button>

                    <button
                      type="button"
                      data-testid="btn-toggle-scheduler"
                      onClick={handleToggleScheduler}
                      disabled={schedulerActionLoading}
                      className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        schedulerStatus?.enabled
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30 hover:bg-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                      title={schedulerStatus?.enabled ? 'Tạm dừng tiến trình tự động' : 'Tiếp tục tiến trình tự động'}
                    >
                      {schedulerStatus?.enabled ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Tạm dừng</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Bật tự động</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress bar & detail metrics */}
                <div className="pt-3 border-t border-[var(--color-border)]/60 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-text-secondary)]">Tiến độ hôm nay:</span>
                      <strong className="text-[var(--color-text-primary)]" data-testid="scheduler-daily-progress-text">
                        {schedulerStatus?.unlimitedDaily || (schedulerStatus?.maxQuestionsPerDay ?? 20) <= 0 || schedulerStatus?.preferredProvider === 'ollama'
                          ? `${schedulerStatus?.generatedToday ?? 0} / ∞ câu (Không giới hạn — Card Local)`
                          : `${schedulerStatus?.generatedToday ?? 0} / ${schedulerStatus?.maxQuestionsPerDay ?? 20} câu`}
                      </strong>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-text-secondary)]">
                      {schedulerStatus?.lastRunTime && (
                        <span>
                          Lần chạy gần nhất: <strong>{parseUtcDate(schedulerStatus.lastRunTime).toLocaleTimeString('vi-VN')}</strong>
                        </span>
                      )}
                      {schedulerStatus?.enabled ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/20">
                          <Clock className={`w-3 h-3 text-emerald-500 ${schedulerStatus?.isRunning ? 'animate-spin' : ''}`} />
                          <SchedulerCountdown
                            nextRunTime={schedulerStatus?.nextRunTime}
                            isRunning={schedulerStatus?.isRunning}
                          />
                        </span>
                      ) : (
                        <span className="text-slate-400">Robot đang tạm dừng</span>
                      )}
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
                      style={{
                        width:
                          schedulerStatus?.unlimitedDaily || (schedulerStatus?.maxQuestionsPerDay ?? 20) <= 0 || schedulerStatus?.preferredProvider === 'ollama'
                            ? '100%'
                            : `${Math.min(100, Math.round(((schedulerStatus?.generatedToday ?? 0) / Math.max(1, schedulerStatus?.maxQuestionsPerDay ?? 20)) * 100))}%`
                      }}
                    />
                  </div>

                  {/* Live status banner when running or when lastError exists */}
                  {schedulerStatus?.isRunning && (
                    <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs flex items-center gap-2.5 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>
                        <strong>Đang tự động sinh câu hỏi ở chế độ nền ({schedulerStatus?.preferredProvider === 'ollama' ? '🖥️ Card Local Ollama qwen2.5:7b' : '☁️ Auto Cloud/Local'})...</strong> Đang gửi lệnh đến mô hình AI. Kết quả sẽ tự động lưu vào mục "Duyệt câu mới" ngay khi hoàn tất!
                      </span>
                    </div>
                  )}
                  {!schedulerStatus?.isRunning && schedulerStatus?.lastError && !dismissedLastError && (
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
                      <span>⚠️ Thông báo lần chạy gần nhất: {schedulerStatus.lastError}</span>
                      <button
                        type="button"
                        onClick={() => setDismissedLastError(true)}
                        className="px-2 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-200 font-bold shrink-0 cursor-pointer"
                        title="Đóng thông báo"
                      >
                        ✕ Đóng
                      </button>
                    </div>
                  )}

                  {/* R5: Engine Mode Switcher (Cloud Free vs Local GPU Unlimited) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[var(--color-text-primary)]">🚀 Chế độ Engine Sinh Đề:</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          data-testid="btn-scheduler-engine-auto"
                          onClick={() =>
                            handleUpdateSchedulerConfig({
                              preferredProvider: 'auto',
                              unlimitedDaily: true,
                              maxQuestionsPerDay: 0,
                            })
                          }
                          disabled={schedulerActionLoading}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                            (schedulerStatus?.preferredProvider ?? 'auto') !== 'ollama'
                              ? 'bg-[var(--color-primary)] text-white shadow-xs'
                              : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/60'
                          }`}
                        >
                          ☁️ Tự động (Cloud Free + Local)
                        </button>
                        <button
                          type="button"
                          data-testid="btn-scheduler-engine-ollama"
                          onClick={() =>
                            handleUpdateSchedulerConfig({
                              preferredProvider: 'ollama',
                              unlimitedDaily: true,
                              maxQuestionsPerDay: 0,
                              intervalHours: 0.05,
                              batchSize: 20,
                            })
                          }
                          disabled={schedulerActionLoading}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                            schedulerStatus?.preferredProvider === 'ollama'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-indigo-500/60'
                          }`}
                        >
                          🖥️ Local GPU (Ollama — Không giới hạn ngày)
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[var(--color-text-primary)]">🎯 Giới hạn ngày:</span>
                      <div className="flex flex-wrap items-center gap-1">
                        {[
                          { label: '♾️ Không giới hạn', val: 0 },
                          { label: '20 câu', val: 20 },
                          { label: '50 câu', val: 50 },
                          { label: '100 câu', val: 100 },
                        ].map((item) => {
                          const isCurrentUnlimited =
                            schedulerStatus?.unlimitedDaily ||
                            (schedulerStatus?.maxQuestionsPerDay ?? 20) <= 0 ||
                            schedulerStatus?.preferredProvider === 'ollama';
                          const isSelected =
                            item.val === 0
                              ? isCurrentUnlimited
                              : !isCurrentUnlimited && (schedulerStatus?.maxQuestionsPerDay ?? 20) === item.val;
                          return (
                            <button
                              key={item.val}
                              type="button"
                              data-testid={`btn-scheduler-daily-limit-${item.val}`}
                              onClick={() =>
                                handleUpdateSchedulerConfig({
                                  maxQuestionsPerDay: item.val,
                                  unlimitedDaily: item.val === 0,
                                })
                              }
                              disabled={schedulerActionLoading}
                              className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                  : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/60'
                              }`}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Frequency & Batch Size Quick Tuning Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[var(--color-text-primary)]">⏱️ Tần suất lặp:</span>
                      <div className="flex flex-wrap items-center gap-1">
                        {[
                          { label: '1 phút (Local)', val: 0.0167 },
                          { label: '3 phút (Local)', val: 0.05 },
                          { label: '5 phút (Local)', val: 0.0833 },
                          { label: '30 phút', val: 0.5 },
                          { label: '1 tiếng', val: 1 },
                          { label: '2 tiếng', val: 2 },
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => handleUpdateSchedulerConfig({ intervalHours: item.val })}
                            disabled={schedulerActionLoading}
                            className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                              Math.abs((schedulerStatus?.intervalHours ?? 2) - item.val) < 0.005
                                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/60'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[var(--color-text-primary)]">📦 Số câu / đợt:</span>
                      <div className="flex flex-wrap items-center gap-1">
                        {[
                          { label: '3 câu', val: 3 },
                          { label: '5 câu', val: 5 },
                          { label: '10 câu', val: 10 },
                          { label: '20 câu', val: 20 },
                          { label: '30 câu', val: 30 },
                          { label: '50 câu (Local)', val: 50 },
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => handleUpdateSchedulerConfig({ batchSize: item.val })}
                            disabled={schedulerActionLoading}
                            className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                              (schedulerStatus?.batchSize ?? 3) === item.val
                                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/60'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Target HSK Level Configuration Row - Super Visual Pill Switcher */}
                  <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🎯</span>
                        <span className="text-xs font-bold text-[var(--color-text-primary)]">
                          Chọn Cấp Độ HSK Cho Robot Tự Động Sinh:
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--color-primary)]">
                        {(schedulerStatus?.targetLevel ?? 0) === 0
                          ? 'Đang bật: 🔄 Tự động bù cấp thiếu (HSK 1 → 6)'
                          : `Đang bật: 🎯 Cố định HSK ${schedulerStatus?.targetLevel}`}
                      </span>
                    </div>

                    {/* 7 Visual Segmented Buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                      {/* Option 0: Auto cycle */}
                      <button
                        type="button"
                        onClick={() => handleUpdateSchedulerTargetLevel(0)}
                        disabled={schedulerActionLoading}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          (schedulerStatus?.targetLevel ?? 0) === 0
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm ring-2 ring-[var(--color-primary)]/20'
                            : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)]/60'
                        }`}
                      >
                        <span className="text-xs font-bold flex items-center gap-1">
                          <span>🔄</span>
                          <span>Xoay vòng</span>
                        </span>
                        <span className={`text-[10px] mt-0.5 ${
                          (schedulerStatus?.targetLevel ?? 0) === 0 ? 'text-white/85' : 'text-[var(--color-text-secondary)]'
                        }`}>
                          Bù cấp thiếu
                        </span>
                      </button>

                      {/* Options 1 to 6 */}
                      {[1, 2, 3, 4, 5, 6].map((lvl) => {
                        const isCurrent = (schedulerStatus?.targetLevel ?? 0) === lvl;
                        const subLabels = ['Sơ cấp 1', 'Sơ cấp 2', 'Trung cấp 1', 'Trung cấp 2', 'Cao cấp 1', 'Cao cấp 2'];
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => handleUpdateSchedulerTargetLevel(lvl)}
                            disabled={schedulerActionLoading}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                              isCurrent
                                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm ring-2 ring-[var(--color-primary)]/20'
                                : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)]/60'
                            }`}
                          >
                            <span className="text-xs font-bold">HSK {lvl}</span>
                            <span className={`text-[10px] mt-0.5 ${
                              isCurrent ? 'text-white/85' : 'text-[var(--color-text-secondary)]'
                            }`}>
                              {subLabels[lvl - 1]}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-[var(--color-text-secondary)] italic pt-0.5">
                      {(schedulerStatus?.targetLevel ?? 0) === 0
                        ? '💡 Chế độ "Xoay vòng" tự động phân tích độ bão hòa đề và sinh bù cho cấp HSK đang còn ít câu nhất.'
                        : `💡 Robot sẽ liên tục tạo thêm các câu hỏi trắc nghiệm & điền từ chuẩn cấp độ HSK ${schedulerStatus?.targetLevel} trong các đợt chạy tiếp theo.`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-[var(--color-text-secondary)] pt-0.5">
                    <span>
                      Chuỗi AI thông minh: <strong>DeepSeek-V3</strong> → <strong>Gemini 1.5</strong> → <strong>Groq Cloud</strong> (100% Free-Tier an toàn).
                    </span>
                    {schedulerStatus?.lastError && (
                      <span className="text-rose-500 font-semibold">
                        Lỗi gần nhất: {schedulerStatus.lastError}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            ) : null}

            {/* FILTER & SEARCH TOOLBAR */}
            <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Select All Checkbox */}
                <label
                  data-testid="label-select-all-pending"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] cursor-pointer text-xs font-semibold select-none"
                >
                  <input
                    type="checkbox"
                    data-testid="checkbox-select-all-pending"
                    checked={isAllPendingSelected}
                    onChange={handleToggleSelectAllPending}
                    className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-0 cursor-pointer"
                  />
                  <span>Chọn tất cả ({filteredPendingQuestions.length} câu)</span>
                </label>

                {/* Level filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Cấp độ:</span>
                  <select
                    data-testid="select-filter-level"
                    value={pendingFilterLevel}
                    onChange={(e) => setPendingFilterLevel(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-semibold focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                  >
                    <option value="all">Tất cả HSK</option>
                    <option value="1">HSK 1</option>
                    <option value="2">HSK 2</option>
                    <option value="3">HSK 3</option>
                    <option value="4">HSK 4</option>
                    <option value="5">HSK 5</option>
                    <option value="6">HSK 6</option>
                  </select>
                </div>

                {/* Skill filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Kỹ năng:</span>
                  <select
                    data-testid="select-filter-skill"
                    value={pendingFilterSkill}
                    onChange={(e) => setPendingFilterSkill(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-semibold focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                  >
                    <option value="all">Tất cả kỹ năng</option>
                    <option value="reading">Đọc hiểu (Reading)</option>
                    <option value="listening">Nghe hiểu (Listening)</option>
                    <option value="writing">Viết (Writing)</option>
                  </select>
                </div>

                {/* Part Type (Task Type) filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Dạng bài:</span>
                  <select
                    data-testid="select-filter-part-type"
                    value={pendingFilterPartType}
                    onChange={(e) => setPendingFilterPartType(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-semibold focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer max-w-[200px] truncate"
                  >
                    <option value="all">Tất cả dạng bài</option>
                    {ALL_PART_TYPES.filter((pt) => {
                      if (pendingFilterLevel !== 'all') {
                        const lvl = parseInt(pendingFilterLevel, 10);
                        if (!isNaN(lvl) && (lvl < pt.minLevel || lvl > pt.maxLevel)) return false;
                      }
                      if (pendingFilterSkill !== 'all' && pt.skill !== pendingFilterSkill) {
                        return false;
                      }
                      return true;
                    }).map((pt) => (
                      <option key={pt.value} value={pt.value}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Trạng thái:</span>
                  <select
                    data-testid="select-filter-status"
                    value={pendingFilterStatus}
                    onChange={(e) => setPendingFilterStatus(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-semibold focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer silk-input"
                  >
                    <option value="pending">Chờ duyệt (Pending)</option>
                    <option value="approved">Đã duyệt (Approved)</option>
                    <option value="disabled">Vô hiệu hóa (Disabled)</option>
                    <option value="all">Tất cả</option>
                  </select>
                </div>

                {/* Topic filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Chủ đề:</span>
                  <select
                    data-testid="select-filter-topic"
                    value={pendingFilterTopic}
                    onChange={(e) => setPendingFilterTopic(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-semibold focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer max-w-[150px] truncate"
                  >
                    <option value="all">Tất cả chủ đề</option>
                    <option value="gia_dinh">Gia đình & Đời sống</option>
                    <option value="truong_hoc">Trường học & Học tập</option>
                    <option value="mua_sam">Mua sắm & Giá cả</option>
                    <option value="du_lich">Du lịch & Giao thông</option>
                    <option value="thoi_tiet">Thời tiết & Mùa</option>
                    <option value="am_thuc">Ẩm thực & Đồ uống</option>
                    <option value="cong_viec">Công việc & Văn phòng</option>
                    <option value="suc_khoe">Sức khỏe & Thể thao</option>
                  </select>
                </div>

                {/* Difficulty filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Độ khó:</span>
                  <select
                    data-testid="select-filter-difficulty"
                    value={pendingFilterDifficulty}
                    onChange={(e) => setPendingFilterDifficulty(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-semibold focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                  >
                    <option value="all">Tất cả độ khó</option>
                    <option value="tier1_difficult">Tier 1 - Khó</option>
                    <option value="tier2_very_difficult">Tier 2 - Rất khó</option>
                    <option value="tier3_challenge">Tier 3 - Thử thách</option>
                  </select>
                </div>
              </div>

              {/* Export button & Real-time search box */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  data-testid="btn-save-question-order"
                  onClick={handleSaveQuestionOrder}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 text-xs font-bold cursor-pointer shrink-0 transition-colors"
                  title="Lưu thứ tự sắp xếp câu hỏi"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu thứ tự ({filteredPendingQuestions.length})</span>
                </button>

                <button
                  type="button"
                  data-testid="btn-export-duyet-de"
                  onClick={() => {
                    setExportModalTitle(`Xuất danh sách câu hỏi hàng chờ duyệt`);
                    setExportModalCount(filteredPendingQuestions.length);
                    setExportModalQuestionIds(filteredPendingQuestions.map((q) => q.id));
                    setExportModalQuestions(filteredPendingQuestions);
                    setExportModalFilterParams(undefined);
                    setExportModalDefaultTitle(`HSK_Duyet_De_${new Date().toISOString().slice(0, 10)}`);
                    setExportModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/20 text-xs font-bold cursor-pointer shrink-0 transition-colors"
                  title="Xuất các câu hỏi đang lọc sang Word, Excel hoặc JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất đề ({filteredPendingQuestions.length})</span>
                </button>

                <div className="relative w-full md:w-72">
                  <Search className="w-3.5 h-3.5 text-[var(--color-text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    data-testid="input-search-pending"
                    placeholder="Tìm kiếm chữ Hán, nghĩa TV, ID, theme..."
                    value={pendingSearchQuery}
                    onChange={(e) => setPendingSearchQuery(e.target.value)}
                    className="w-full pl-8.5 pr-3 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs focus:outline-hidden focus:border-[var(--color-primary)]"
                  />
                  {pendingSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setPendingSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Subtle background sync status badge */}
                {isBackgroundPolling && (
                  <div
                    data-testid="badge-background-polling"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 animate-pulse shrink-0"
                    title="Đang đồng bộ ngầm các câu hỏi vừa sinh mà không làm gián đoạn đọc..."
                  >
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span className="hidden sm:inline">Đang cập nhật ngầm...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky non-intrusive banner when new questions arrive during background generation */}
            {newIncomingCount > 0 && (
              <div
                data-testid="banner-new-incoming-questions"
                className="sticky top-2 z-20 flex items-center justify-between px-4 py-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 backdrop-blur-md shadow-lg transition-all animate-in fade-in slide-in-from-top-2"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                  </span>
                  <span className="text-xs font-bold">
                    Có {newIncomingCount} câu hỏi mới vừa được sinh ngầm và tự động đưa lên đầu danh sách!
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setNewIncomingCount(0);
                    }}
                    className="px-3 py-1 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    Xem ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewIncomingCount(0)}
                    className="p-1 hover:bg-indigo-500/20 rounded-lg text-indigo-400 hover:text-indigo-600 cursor-pointer"
                    title="Đóng thông báo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* PENDING QUESTIONS LIST */}
            {pendingLoading ? (
              <div className="p-12 text-center rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-primary)] mx-auto" />
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                  Đang tải danh sách câu hỏi chờ duyệt...
                </p>
              </div>
            ) : pendingError ? (
              <div className="p-8 text-center rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-600 space-y-2">
                <AlertCircle className="w-6 h-6 mx-auto" />
                <p className="text-sm font-bold">Không thể tải danh sách câu hỏi chờ duyệt</p>
                <p className="text-xs">{pendingError}</p>
                <button
                  type="button"
                  onClick={() => loadPendingQuestions()}
                  className="mt-2 px-4 py-1.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-colors cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            ) : filteredPendingQuestions.length === 0 ? (
              <div className="p-10 sm:p-14 text-center rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-4">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto ${
                  totalPendingCount > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                }`}>
                  {totalPendingCount > 0 ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <p className="text-base font-bold text-[var(--color-text-primary)]">
                    {totalPendingCount > 0
                      ? `Thống kê có ${totalPendingCount} câu nhưng chưa tải được nội dung`
                      : 'Hàng đợi đang trống'}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {totalPendingCount > 0
                      ? 'Bấm Làm mới, hoặc nới bộ lọc Cấp độ / Kỹ năng / Trạng thái. Nếu vẫn trống, mở tab Tạo câu hỏi AI rồi quay lại.'
                      : 'Không có câu nào khớp bộ lọc, hoặc tất cả đã được duyệt. Sinh thêm câu mới khi cần:'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHasUserSwitchedTab(true);
                      setActiveSubTab('generate');
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-xs hover:bg-[var(--color-primary-dark)] shadow-sm transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Tạo câu hỏi mới theo chủ đề</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerSchedulerBatch}
                    disabled={schedulerActionLoading || schedulerStatus?.isRunning}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] hover:border-[var(--color-primary)] font-bold text-xs text-[var(--color-text-primary)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Robot sinh ngay 3 câu</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4" data-testid="pending-questions-list">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  Đang hiện {filteredPendingQuestions.length} câu — kéo xuống để đọc đề, đáp án và lời giải.
                </p>
                {filteredPendingQuestions.map((q, idx) => {
                  const isSelected = selectedPendingIds.has(q.id);
                  const isEditing = editingPendingId === q.id;
                  const themeTag = formatThemeTag(q.illustration_theme);

                  return (
                    <div
                      key={q.id}
                      data-testid={`pending-card-${q.id}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        try {
                          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                          if (data?.type === 'question' && data.id && data.id !== q.id) {
                            handleReorderQuestion(data.id, q.id);
                          }
                        } catch {}
                      }}
                      className={`p-5 sm:p-6 rounded-3xl bg-[var(--color-surface)] border shadow-xs space-y-4 transition-all ${
                        isSelected
                          ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20'
                          : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40'
                      }`}
                    >
                      {/* Card Header: Drag Handle, Sequence Number, Checkbox, Badges, ID */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)]/50 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Question Drag Handle */}
                          <div
                            draggable
                            data-testid={`btn-drag-handle-question-${q.id}`}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'question', id: q.id, index: idx }));
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              try {
                                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                if (data?.type === 'question' && data.id && data.id !== q.id) {
                                  handleReorderQuestion(data.id, q.id);
                                }
                              } catch {}
                            }}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center cursor-grab active:cursor-grabbing text-[var(--color-text-secondary)]"
                            title="Kéo thả để sắp xếp thứ tự câu hỏi"
                          >
                            <GripVertical className="w-4 h-4 cursor-grab active:cursor-grabbing text-[var(--color-text-secondary)]" />
                          </div>

                          {/* Accessible Move Question Up/Down Buttons */}
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              data-testid={`btn-move-question-up-${q.id}`}
                              disabled={idx === 0}
                              onClick={() => handleMoveQuestion(q.id, 'up')}
                              className="p-1 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title="Di chuyển câu hỏi lên trên"
                              aria-label={`Di chuyển câu ${idx + 1} lên`}
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              data-testid={`btn-move-question-down-${q.id}`}
                              disabled={idx === filteredPendingQuestions.length - 1}
                              onClick={() => handleMoveQuestion(q.id, 'down')}
                              className="p-1 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title="Di chuyển câu hỏi xuống dưới"
                              aria-label={`Di chuyển câu ${idx + 1} xuống`}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Dynamic Sequence Number */}
                          <span
                            data-testid="card-sequence-number"
                            className="font-bold text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                          >
                            {formatSequenceNumber(idx)}
                          </span>

                          <input
                            type="checkbox"
                            data-testid={`checkbox-pending-${q.id}`}
                            checked={isSelected}
                            onChange={() => handleToggleSelectPending(q.id)}
                            className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-0 cursor-pointer"
                          />
                          <span
                            data-testid="card-question-id"
                            className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                          >
                            {q.id}
                          </span>
                          <span
                            data-testid="card-hsk-level"
                            className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                          >
                            HSK {q.level}
                          </span>
                          <span
                            data-testid="card-skill-badge"
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                          >
                            {q.skill === 'listening'
                              ? '🎧 Nghe hiểu'
                              : q.skill === 'reading'
                              ? '📖 Đọc hiểu'
                              : q.skill === 'writing'
                              ? '✍️ Viết'
                              : q.skill}
                          </span>
                          <span
                            data-testid="card-part-type"
                            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[var(--color-text-secondary)]"
                          >
                            {q.part_type}
                          </span>
                          {q.provider_used && (
                            <span
                              data-testid="card-provider-badge"
                              className="text-[10px] text-[var(--color-text-secondary)] font-mono bg-[var(--color-background)] px-2 py-0.5 rounded border border-[var(--color-border)]"
                            >
                              LLM: {q.provider_used}
                            </span>
                          )}
                          {q.batch_id && (
                            <span
                              data-testid="card-batch-id"
                              className="text-[10px] text-[var(--color-text-secondary)] font-mono bg-[var(--color-background)] px-2 py-0.5 rounded border border-[var(--color-border)]"
                            >
                              Lô: {q.batch_id}
                            </span>
                          )}
                          {themeTag && (
                            <span
                              data-testid="card-theme-tag"
                              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                            >
                              {themeTag}
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div>
                          {q.status === 'approved' && (
                            <span
                              data-testid="card-status-approved"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            >
                              <Check className="w-3 h-3" />
                              <span>ĐÃ DUYỆT</span>
                            </span>
                          )}
                          {q.status === 'rejected' && (
                            <span
                              data-testid="card-status-rejected"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            >
                              <X className="w-3 h-3" />
                              <span>TỪ CHỐI</span>
                            </span>
                          )}
                          {q.status === 'disabled' && (
                            <span
                              data-testid="card-status-disabled"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20"
                            >
                              <Pause className="w-3 h-3" />
                              <span>VÔ HIỆU HÓA</span>
                            </span>
                          )}
                          {q.status !== 'approved' && q.status !== 'rejected' && q.status !== 'disabled' && (
                            <span
                              data-testid="card-status-pending"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            >
                              <Clock className="w-3 h-3" />
                              <span>CHỜ DUYỆT</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* INLINE EDIT MODE */}
                      {isEditing ? (
                        <div
                          data-testid="inline-edit-form"
                          className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-primary)]/40 space-y-4 animate-in fade-in"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
                            <span className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1.5">
                              <Edit3 className="w-4 h-4" />
                              <span>Chế độ chỉnh sửa trực tiếp (Inline Edit)</span>
                            </span>
                            <span className="text-[11px] text-[var(--color-text-secondary)]">
                              Chọn nút tròn để đặt đáp án đúng
                            </span>
                          </div>

                          {editPendingError && (
                            <div
                              data-testid="inline-edit-error"
                              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs flex items-center gap-2"
                            >
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{editPendingError}</span>
                            </div>
                          )}

                          {/* Stem input */}
                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                              Câu dẫn (Chinese Stem):
                            </label>
                            <input
                              type="text"
                              data-testid="input-edit-stem"
                              value={editPendingStem}
                              onChange={(e) => setEditPendingStem(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] font-chinese text-base font-bold text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)]"
                            />
                          </div>

                          {/* Pinyin and Theme inputs */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                                Phiên âm Pinyin (có dấu):
                              </label>
                              <input
                                type="text"
                                data-testid="input-edit-pinyin"
                                value={editPendingPinyin}
                                onChange={(e) => setEditPendingPinyin(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)]"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                                Chủ đề hình ảnh (Illustration Theme):
                              </label>
                              <input
                                type="text"
                                data-testid="input-edit-theme"
                                value={editPendingTheme}
                                onChange={(e) => setEditPendingTheme(e.target.value)}
                                placeholder="Ví dụ: taxi, apple, hospital, train, school..."
                                className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)]"
                              />
                            </div>
                          </div>

                          {/* Options inputs with drag handles and accessible move buttons */}
                          {editPendingOptions.length > 0 ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                                  Các phương án lựa chọn (Kéo thả hoặc bấm nút mũi tên để đổi thứ tự, chọn nút tròn để đặt đáp án đúng):
                                </label>
                                <span className="text-[11px] text-[var(--color-text-secondary)] italic">
                                  Đáp án đúng tự động cập nhật theo vị trí mới
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {editPendingOptions.map((opt, optIdx) => {
                                  const isCorrect = editPendingAnswerIdx === optIdx;
                                  const label = ['A', 'B', 'C', 'D', 'E', 'F'][optIdx] || String(optIdx + 1);

                                  return (
                                    <div
                                      key={optIdx}
                                      draggable
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'option-inline', index: optIdx }));
                                        e.dataTransfer.effectAllowed = 'move';
                                      }}
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'move';
                                      }}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        try {
                                          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                          if (data?.type === 'option-inline' && typeof data.index === 'number' && data.index !== optIdx) {
                                            handleReorderInlineOptions(data.index, optIdx);
                                          }
                                        } catch {}
                                      }}
                                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                        isCorrect
                                          ? 'border-emerald-500 bg-emerald-500/10'
                                          : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                                      }`}
                                    >
                                      {/* Option Drag Handle */}
                                      <div
                                        data-testid={`btn-drag-handle-option-${q.id}-${optIdx}`}
                                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-grab active:cursor-grabbing text-[var(--color-text-secondary)] shrink-0"
                                        title="Kéo thả để đổi thứ tự phương án"
                                      >
                                        <GripVertical className="w-4 h-4 cursor-grab active:cursor-grabbing text-[var(--color-text-secondary)]" />
                                      </div>

                                      {/* Accessible Up/Down Buttons */}
                                      <div className="flex flex-col gap-0.5 shrink-0">
                                        <button
                                          type="button"
                                          data-testid={`btn-move-option-up-${q.id}-${optIdx}`}
                                          disabled={optIdx === 0}
                                          onClick={() => handleReorderInlineOptions(optIdx, optIdx - 1)}
                                          className="text-gray-400 hover:text-indigo-600 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer p-0.5"
                                          title="Di chuyển lên"
                                          aria-label={`Di chuyển phương án ${label} lên trên`}
                                        >
                                          <ChevronUp className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          data-testid={`btn-move-option-down-${q.id}-${optIdx}`}
                                          disabled={optIdx === editPendingOptions.length - 1}
                                          onClick={() => handleReorderInlineOptions(optIdx, optIdx + 1)}
                                          className="text-gray-400 hover:text-indigo-600 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer p-0.5"
                                          title="Di chuyển xuống"
                                          aria-label={`Di chuyển phương án ${label} xuống dưới`}
                                        >
                                          <ChevronDown className="w-3 h-3" />
                                        </button>
                                      </div>

                                      <input
                                        type="radio"
                                        data-testid={`radio-edit-answer-${optIdx}`}
                                        id={`opt-radio-${q.id}-${optIdx}`}
                                        name={`answer-radio-${q.id}`}
                                        checked={isCorrect}
                                        onChange={() => setEditPendingAnswerIdx(optIdx)}
                                        className="w-4 h-4 text-emerald-600 focus:ring-0 cursor-pointer shrink-0"
                                      />
                                      <span className="font-bold text-xs text-[var(--color-text-secondary)] shrink-0">
                                        {label}.
                                      </span>
                                      <input
                                        type="text"
                                        data-testid={`input-edit-option-${optIdx}`}
                                        value={opt}
                                        onChange={(e) => {
                                          const next = [...editPendingOptions];
                                          next[optIdx] = e.target.value;
                                          setEditPendingOptions(next);
                                        }}
                                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] font-chinese text-sm font-semibold text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)]"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-secondary)] flex items-center gap-2 italic">
                              <span>✍️</span>
                              <span>Dạng bài viết tự luận (HSK Writing): Thí sinh làm bài bằng cách tự viết câu/đoạn văn, không có các phương án trắc nghiệm A, B, C, D.</span>
                            </div>
                          )}

                          {/* Explanation input */}
                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                              Lời giải thích chi tiết tiếng Việt:
                            </label>
                            <textarea
                              rows={3}
                              data-testid="textarea-edit-explanation"
                              value={editPendingExplanationVi}
                              onChange={(e) => setEditPendingExplanationVi(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-hidden focus:border-[var(--color-primary)] leading-relaxed"
                            />
                          </div>

                          {/* Inline Edit Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                            <button
                              type="button"
                              data-testid="btn-cancel-edit"
                              onClick={handleCancelInlineEdit}
                              disabled={isSavingPendingEdit}
                              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              data-testid="btn-save-edit"
                              onClick={() => handleSavePendingEdit(q.id)}
                              disabled={isSavingPendingEdit}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isSavingPendingEdit ? (
                                <>
                                  <RefreshCw data-testid="spinner-saving-edit" className="w-3.5 h-3.5 animate-spin" />
                                  <span>Đang lưu...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Lưu thay đổi</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* NORMAL CARD VIEW */
                        <div className="space-y-4">
                          {/* Validation Warning / Error Banners */}
                          {q.validation_diagnostics?.warnings && q.validation_diagnostics.warnings.length > 0 && (
                            <div
                              data-testid="card-validation-warnings"
                              className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2"
                            >
                              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="font-bold">
                                  Cảnh báo kiểm tra định dạng ({q.validation_diagnostics.warnings.length}):
                                </span>
                                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                                  {q.validation_diagnostics.warnings.map((w, wIdx) => (
                                    <li key={wIdx}>{w}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                          {q.validation_diagnostics?.errors && q.validation_diagnostics.errors.length > 0 && (
                            <div
                              data-testid="card-validation-errors"
                              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2"
                            >
                              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="font-bold">
                                  Lỗi cấu trúc câu hỏi ({q.validation_diagnostics.errors.length}):
                                </span>
                                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                                  {q.validation_diagnostics.errors.map((e, eIdx) => (
                                    <li key={eIdx}>{e}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* Question Stem & Listening Dialogue Split */}
                          {(() => {
                            const isListening = q.skill === 'listening';
                            const listeningParts = isListening ? parseListeningParts(q.stem, q.pinyin, q.part_type) : null;
                            const hasSplitDialogue = Boolean(listeningParts && listeningParts.dialoguePart && listeningParts.questionPart && listeningParts.dialoguePart !== listeningParts.questionPart);

                            return (
                              <div className="space-y-2.5">
                                {hasSplitDialogue && (
                                  <div className="p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-[var(--color-text-secondary)] space-y-1.5">
                                    <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                                      <Volume2 className="w-3.5 h-3.5 shrink-0" />
                                      <span>Kịch bản nghe (Chỉ phát trong âm thanh, không đọc câu hỏi):</span>
                                    </div>
                                    <p className="font-chinese text-sm sm:text-base text-[var(--color-text-primary)] leading-relaxed pl-1 whitespace-pre-line">
                                      {listeningParts!.dialoguePart}
                                    </p>
                                  </div>
                                )}

                                {isListening && (
                                  <div data-testid={`card-listening-audio-${q.id}`} className="space-y-2 p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-indigo-500/10">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300">Giọng AI:</span>
                                        <select
                                          value={selectedTtsVoice}
                                          onChange={(e) => setSelectedTtsVoice(e.target.value)}
                                          className="text-xs px-2 py-0.5 rounded-lg bg-[var(--color-background)] border border-indigo-500/30 text-[var(--color-text-primary)] font-medium focus:outline-hidden"
                                          data-testid={`select-tts-voice-${q.id}`}
                                        >
                                          <option value="auto">✨ Tự động Nam/Nữ</option>
                                          <option value="zh-CN-XiaoxiaoNeural">👩 Hiểu Hiểu (Nữ HSK)</option>
                                          <option value="zh-CN-XiaoyiNeural">👧 Hiểu Y (Nữ trẻ trung)</option>
                                          <option value="zh-CN-YunxiNeural">👨 Vân Hy (Nam tự nhiên)</option>
                                          <option value="zh-CN-YunjianNeural">🎙️ Vân Kiện (Nam chuẩn thi)</option>
                                          <option value="zh-CN-YunyangNeural">📰 Vân Dương (Nam tin tức)</option>
                                          <option value="zh-CN-YunxiaNeural">👦 Vân Hạ (Nam học sinh)</option>
                                          <option value="zh-CN-liaoning-XiaobeiNeural">🌸 Tiểu Bối (Nữ Đông Bắc)</option>
                                          <option value="zh-CN-shaanxi-XiaoniNeural">🏮 Tiểu Ni (Nữ Thiểm Tây)</option>
                                        </select>
                                        <button
                                          type="button"
                                          data-testid={`btn-audition-voice-${q.id}`}
                                          onClick={() => handleAuditionVoice(selectedTtsVoice, q.id)}
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-500/10 border border-indigo-500/20 cursor-pointer"
                                          title="Nghe thử mẫu giọng đọc đã chọn"
                                        >
                                          <Volume2 className={`w-3 h-3 ${isAuditioningVoiceId === q.id ? 'animate-bounce text-indigo-500' : ''}`} />
                                          <span>{isAuditioningVoiceId === q.id ? 'Đang đọc...' : 'Thử giọng'}</span>
                                        </button>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <label className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-secondary)] cursor-pointer select-none">
                                          <input
                                            type="checkbox"
                                            checked={withIntroChime}
                                            onChange={(e) => setWithIntroChime(e.target.checked)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                          />
                                          <span>🔔 Chuông dạo 1.2s</span>
                                        </label>

                                        <button
                                          type="button"
                                          onClick={() => handlePlayWebSpeech(hasSplitDialogue ? listeningParts!.dialoguePart : (q.passage || q.stem), q.id)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-all cursor-pointer"
                                          title="Nghe thử trực tiếp với chuông dạo 1.2s"
                                        >
                                          {isPlayingWebSpeechId === q.id ? (
                                            <>
                                              <Volume2 className="w-3 h-3 animate-bounce text-indigo-500" />
                                              <span>Đang phát...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Volume2 className="w-3 h-3" />
                                              <span>Nghe thử AI</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>

                                    {q.audio_url ? (
                                      <audio
                                        controls
                                        src={q.audio_url}
                                        className="w-full h-10 mt-1"
                                        data-testid={`audio-player-${q.id}`}
                                      />
                                    ) : (
                                      <p className="text-xs text-[var(--color-text-secondary)] italic mt-1">
                                        Chưa có file âm thanh tĩnh. Nhấn nút <strong>"🎵 Tạo Audio"</strong> bên dưới để tạo file nghe chuẩn với giọng đã chọn.
                                      </p>
                                    )}
                                  </div>
                                )}

                                <div className="space-y-1 pt-1">
                                  {hasSplitDialogue && (
                                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                                      ❓ Câu hỏi hiển thị trên màn hình:
                                    </span>
                                  )}
                                  <p
                                    data-testid="card-stem-text"
                                    className="font-chinese text-base sm:text-lg font-bold text-[var(--color-text-primary)] leading-relaxed"
                                  >
                                    {hasSplitDialogue ? listeningParts!.questionPart : q.stem}
                                  </p>
                                  {(hasSplitDialogue ? listeningParts!.questionPinyin : q.pinyin) && (
                                    <p
                                      data-testid="card-pinyin-text"
                                      className="font-sans text-xs sm:text-sm text-[var(--color-text-secondary)] italic"
                                    >
                                      {hasSplitDialogue ? listeningParts!.questionPinyin : q.pinyin}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Image Options Grid (看图选择 - options_images present or picture_match task) */}
                          {(() => {
                            const isPic = Boolean(
                              (Array.isArray(q.options_images) && q.options_images.length > 0) ||
                              (Boolean(q.part_type && q.part_type.includes('picture_match')) && Array.isArray(q.options) && q.options.length > 0)
                            );
                            const optImages = (Array.isArray(q.options_images) && q.options_images.length > 0)
                              ? q.options_images
                              : isPic && Array.isArray(q.options)
                              ? q.options.map((opt) => resolveSceneKey(opt) || opt)
                              : [];

                            if (isPic && optImages.length > 0) {
                              return (
                                <div
                                  data-testid="card-option-images"
                                  className={`grid gap-2.5 pt-1 ${optImages.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}
                                >
                                  {optImages.map((scene, imageIdx) => {
                                    const isCorrect = q.answer_idx === imageIdx;
                                    const label = String.fromCharCode(65 + imageIdx);
                                    const optText = q.options?.[imageIdx];

                                    return (
                                      <div
                                        key={`${scene}-${imageIdx}`}
                                        className={`space-y-1.5 rounded-2xl border p-2.5 transition-all silk-card-interactive ${
                                          isCorrect
                                            ? 'border-2 border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 shadow-xs'
                                            : 'border border-[var(--color-border)] bg-[var(--color-background)]'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between text-xs font-bold px-1">
                                          <span
                                            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${
                                              isCorrect
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-[var(--color-border)]/60 text-[var(--color-text-secondary)]'
                                            }`}
                                          >
                                            {label}
                                          </span>
                                          {isCorrect && (
                                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                                              <span>Đáp án đúng</span>
                                            </span>
                                          )}
                                        </div>
                                        <HSKIllustrationCanvas scene={scene} aspectRatio="4/3" heightClass="h-24 sm:h-28" isOptionCard />
                                        {optText && (
                                          <div className="text-center font-chinese text-xs sm:text-sm font-medium text-[var(--color-text-primary)] pt-0.5">
                                            {optText}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }

                            if (Array.isArray(q.options) && q.options.length > 0) {
                              return (
                                <div
                                  data-testid="card-options-grid"
                                  className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1"
                                >
                                  {q.options.map((opt, optIdx) => {
                                    const isCorrect = q.answer_idx === optIdx;
                                    const label = String.fromCharCode(65 + optIdx);

                                    return (
                                      <div
                                        key={optIdx}
                                        draggable
                                        data-testid={isCorrect ? 'card-option-correct' : `card-option-${optIdx}`}
                                        data-option-index={optIdx}
                                        onDragStart={(e) => {
                                          e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'option-card', questionId: q.id, index: optIdx }));
                                          e.dataTransfer.effectAllowed = 'move';
                                        }}
                                        onDragOver={(e) => {
                                          e.preventDefault();
                                          e.dataTransfer.dropEffect = 'move';
                                        }}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          try {
                                            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                            if (data?.type === 'option-card' && data.questionId === q.id && typeof data.index === 'number' && data.index !== optIdx) {
                                              handleReorderCardOptions(q.id, data.index, optIdx);
                                            }
                                          } catch {}
                                        }}
                                        className={`p-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm transition-all ${
                                          isCorrect
                                            ? 'border-2 border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 font-semibold shadow-xs'
                                            : 'border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-primary)]'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          {/* Option Drag Handle */}
                                          <div
                                            data-testid={`btn-drag-handle-option-${q.id}-${optIdx}`}
                                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-grab active:cursor-grabbing text-[var(--color-text-secondary)] shrink-0"
                                            title="Kéo thả để sắp xếp phương án"
                                          >
                                            <GripVertical className="w-4 h-4 cursor-grab active:cursor-grabbing text-[var(--color-text-secondary)]" />
                                          </div>

                                          {/* Accessible Option Up/Down Buttons */}
                                          <div className="flex flex-col gap-0.5 shrink-0">
                                            <button
                                              type="button"
                                              data-testid={`btn-move-option-up-${q.id}-${optIdx}`}
                                              disabled={optIdx === 0}
                                              onClick={() => handleReorderCardOptions(q.id, optIdx, optIdx - 1)}
                                              className="text-gray-400 hover:text-indigo-600 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer p-0.5"
                                              title="Di chuyển lên"
                                              aria-label={`Di chuyển phương án ${label} lên trên`}
                                            >
                                              <ChevronUp className="w-3 h-3" />
                                            </button>
                                            <button
                                              type="button"
                                              data-testid={`btn-move-option-down-${q.id}-${optIdx}`}
                                              disabled={optIdx === q.options.length - 1}
                                              onClick={() => handleReorderCardOptions(q.id, optIdx, optIdx + 1)}
                                              className="text-gray-400 hover:text-indigo-600 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer p-0.5"
                                              title="Di chuyển xuống"
                                              aria-label={`Di chuyển phương án ${label} xuống dưới`}
                                            >
                                              <ChevronDown className="w-3 h-3" />
                                            </button>
                                          </div>

                                          <span
                                            data-testid="card-option-letter"
                                            className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                              isCorrect
                                                ? 'bg-emerald-500 text-white shadow-xs'
                                                : 'bg-gray-100 dark:bg-gray-800 text-[var(--color-text-secondary)]'
                                            }`}
                                          >
                                            {label}
                                          </span>
                                          <span data-testid="card-option-text" className="font-chinese font-medium">
                                            {opt}
                                          </span>
                                        </div>

                                        {isCorrect && (
                                          <span
                                            data-testid="card-correct-badge"
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md shrink-0"
                                          >
                                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                            <span>Đáp án đúng</span>
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }

                            return (
                              <div className="p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/70 text-xs sm:text-sm text-[var(--color-text-secondary)] flex items-center gap-2.5">
                                <span className="text-base">✍️</span>
                                <span>
                                  <strong>Dạng bài viết tự luận (HSK Writing):</strong> Học viên tự viết câu hoặc đoạn văn theo yêu cầu đề bài (không có phương án trắc nghiệm A, B, C, D).
                                </span>
                              </div>
                            );
                          })()}

                          {/* Detailed Vietnamese Explanation */}
                          {q.explanation_vi && (
                            <div
                              data-testid="card-explanation-box"
                              className="p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]/60 text-xs sm:text-sm space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[11px] text-[var(--color-text-secondary)] uppercase tracking-wider block">
                                  Giải thích chi tiết (Tiếng Việt):
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleExplanation(q.id)}
                                  className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  <span>{isExplanationOpen(q.id) ? 'Ẩn giải thích' : 'Xem giải thích'}</span>
                                </button>
                              </div>

                              {isExplanationOpen(q.id) && (
                                <>
                                  <p
                                    data-testid="card-explanation-text"
                                    className="leading-relaxed text-[var(--color-text-primary)]"
                                  >
                                    {q.explanation_vi}
                                  </p>

                                  {/* Structured Distractor Rationales */}
                                  {q.distractor_rationales && q.distractor_rationales.length > 0 && (
                                    <div
                                      data-testid="card-distractor-rationales"
                                      className="pt-2.5 border-t border-[var(--color-border)]/50 space-y-1.5"
                                    >
                                      <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                                        Phân tích phương án gây nhiễu (Distractor Rationales):
                                      </span>
                                      <div className="grid grid-cols-1 gap-1.5">
                                        {q.distractor_rationales.map((d, dIdx) => {
                                          const label = ['A', 'B', 'C', 'D'][d.optionIdx] || `P.Án ${d.optionIdx + 1}`;
                                          return (
                                            <div
                                              key={dIdx}
                                              className={`p-2 rounded-xl text-xs flex items-start gap-2 ${
                                                d.isCorrect
                                                  ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20'
                                                  : 'bg-amber-500/5 text-[var(--color-text-primary)] border border-amber-500/15'
                                              }`}
                                            >
                                              <span className="font-bold shrink-0">{label} ({d.optionText}):</span>
                                              <span className="leading-relaxed">{d.rationaleVi}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {/* Rejection Note (if previously rejected) */}
                          {q.rejection_note && (
                            <div
                              data-testid="card-rejection-note"
                              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2"
                            >
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Ghi chú từ chối: </span>
                                <span>{q.rejection_note}</span>
                              </div>
                            </div>
                          )}

                          {/* Card Footer Actions */}
                          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]/40">
                            {q.skill === 'listening' && (
                              <button
                                type="button"
                                data-testid={`btn-tts-action-${q.id}`}
                                onClick={() => handleGenerateTts(q)}
                                disabled={generatingAudioIds.has(q.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {generatingAudioIds.has(q.id) ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Đang tạo audio...</span>
                                  </>
                                ) : q.audio_url ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>🔄 Tạo lại</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-sm">🎵</span>
                                    <span>Tạo Audio</span>
                                  </>
                                )}
                              </button>
                            )}
                            <button
                              type="button"
                              data-testid={`btn-edit-pending-${q.id}`}
                              onClick={() => handleStartInlineEdit(q)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--color-background)] border border-[var(--color-border)] hover:border-indigo-400 text-[var(--color-text-primary)] transition-all cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Sửa nội dung</span>
                            </button>

                            {q.status !== 'disabled' && (
                              <button
                                type="button"
                                data-testid={`btn-disable-pending-${q.id}`}
                                onClick={() => handleDisablePending([q.id])}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-500/10 hover:bg-gray-500/20 text-gray-700 dark:text-gray-300 border border-gray-500/20 transition-all cursor-pointer"
                              >
                                <Pause className="w-3.5 h-3.5" />
                                <span>Vô hiệu hóa</span>
                              </button>
                            )}

                            {q.status !== 'rejected' && q.status !== 'approved' && (
                              <button
                                type="button"
                                data-testid={`btn-reject-pending-${q.id}`}
                                onClick={() => {
                                  setRejectingPendingIds([q.id]);
                                  setRejectReasonNote('');
                                  setIsRejectModalOpen(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 transition-all cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Từ chối</span>
                              </button>
                            )}

                            {q.status !== 'approved' && (
                              <button
                                type="button"
                                data-testid={`btn-approve-pending-${q.id}`}
                                onClick={() => handleApprovePending([q.id])}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Phê duyệt</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* VIEW 1: GENERATION PANEL */}
        {activeSubTab === 'generate' && (
          <section aria-label="Generation Control Panel" className="space-y-4">
            <div className="p-5 sm:p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-[var(--color-primary)] font-bold text-sm mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Question Generator Studio</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold font-serif text-[var(--color-text-primary)]">
                  Cấu hình Tham số Sinh Câu hỏi HSK 3.0
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
                  Lựa chọn cấp độ HSK, dạng câu hỏi và số lượng. Hệ thống bốc ngẫu nhiên các từ vựng ưu tiên xoay vòng từ kho CLEC chính thức và gọi Solver AI đối soát lời giải độc lập.
                </p>
              </div>

              {/* Error Banner */}
              {genError && (
                <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Lỗi trong quá trình sinh câu hỏi:</p>
                    <p>{genError}</p>
                  </div>
                </div>
              )}

              {/* Generation Summary Banners (All Rejected, Partial, Dry Run, Success) */}
              {genSummary && genSummary.status !== 'failed' && (
                <div
                  className={`mt-4 p-4 rounded-2xl text-xs sm:text-sm flex items-start gap-3 animate-in fade-in border ${
                    genSummary.isDryRun
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300'
                      : genSummary.status === 'all_rejected'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                      : genSummary.status === 'partial'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {genSummary.isDryRun ? (
                    <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
                  ) : genSummary.status === 'all_rejected' ? (
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                  ) : genSummary.status === 'partial' ? (
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
                  )}
                  <div className="space-y-1.5 flex-1">
                    <p className="font-bold text-sm">
                      {genSummary.isDryRun
                        ? 'Chế độ chạy thử (Dry Run) hoàn tất'
                        : genSummary.status === 'all_rejected'
                        ? 'Toàn bộ câu hỏi bị từ chối bởi bộ lọc kiểm duyệt'
                        : genSummary.status === 'partial'
                        ? 'Sinh câu hỏi thành công một phần'
                        : 'Sinh câu hỏi thành công!'}
                    </p>
                    <p className="text-xs opacity-90">
                      {genSummary.message ||
                        (genSummary.isDryRun
                          ? 'Đã kiểm tra chất lượng đề thi thành công. Không có câu hỏi nào được lưu vào cơ sở dữ liệu.'
                          : genSummary.status === 'all_rejected'
                          ? `0 câu hỏi được lưu vào hàng đợi duyệt (${genSummary.rejectedCount} câu không đạt chuẩn kiểm duyệt).`
                          : genSummary.status === 'partial'
                          ? `Đã lưu ${genSummary.savedCount} câu hỏi vào hàng đợi duyệt (${genSummary.rejectedCount} câu bị từ chối do trùng lặp hoặc lỗi định dạng).`
                          : `Đã lưu thành công ${genSummary.savedCount} câu hỏi vào hàng đợi duyệt.`)}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[var(--color-text-secondary)]">Tổng số câu sinh: </span>
                        <strong>{genSummary.generatedCount ?? (genSummary.savedCount + genSummary.rejectedCount)} câu</strong>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-secondary)]">Đạt chuẩn (Lưu Staging): </span>
                        <strong className="text-emerald-600 dark:text-emerald-400">{genSummary.savedCount} câu</strong>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-secondary)]">Bị từ chối (FAIL): </span>
                        <strong className={genSummary.rejectedCount > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-gray-500"}>
                          {genSummary.rejectedCount} câu
                        </strong>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-secondary)]">Model LLM: </span>
                        <span className="font-medium">{genSummary.model}</span>
                      </div>
                    </div>

                    {/* Detailed Validation Failures Breakdown if any questions failed 6 Gates */}
                    {genSummary.rejectedCount > 0 && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1 mt-2">
                        <p className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Chi tiết lý do câu hỏi bị bộ lọc 6 Cổng kiểm định từ chối:</span>
                        </p>
                        {genSummary.rejectedReasons && genSummary.rejectedReasons.length > 0 ? (
                          <ul className="list-disc list-inside space-y-0.5 text-rose-700 dark:text-rose-300">
                            {genSummary.rejectedReasons.map((r, rIdx) => (
                              <li key={rIdx}>
                                <span>{r.reason}</span>
                                {r.count > 1 ? <span className="font-bold"> ({r.count} câu)</span> : null}
                              </li>
                            ))}
                          </ul>
                        ) : genSummary.failures && genSummary.failures.length > 0 ? (
                          <ul className="list-disc list-inside space-y-0.5 text-rose-700 dark:text-rose-300">
                            {genSummary.failures.map((f, fIdx) => (
                              <li key={fIdx}>
                                <span>Câu #{f.candidate_index + 1}: {f.errors.join('; ')}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-rose-700 dark:text-rose-300">
                            Các câu hỏi không vượt qua cổng kiểm định tính tự nhiên, độ bao phủ từ vựng hoặc mâu thuẫn lời giải.
                          </p>
                        )}
                      </div>
                    )}
                    {genSummary.savedCount > 0 && !genSummary.isDryRun && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setHasUserSwitchedTab(true);
                            setPendingFilterLevel('all');
                            setPendingFilterSkill('all');
                            setPendingFilterStatus('pending');
                            setPendingSearchQuery('');
                            setActiveSubTab('duyet_de');
                            loadProgress();
                            loadPendingQuestions({ level: 'all', skill: 'all', status: 'pending' });
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white font-bold text-xs hover:bg-[var(--color-primary-dark)] shadow-sm transition-all cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Chuyển sang mục "Duyệt câu mới" để kiểm tra & phê duyệt ({genSummary.savedCount} câu vừa sinh) →</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleGenerateSubmit} className="mt-6 space-y-5">
                {/* Level Quick-Select Visual Pills */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                      1. Chọn Cấp Độ HSK Mục Tiêu (HSK 1 – 6)
                    </label>
                    <span className="text-[11px] text-[var(--color-text-secondary)]">
                      Bấm nhanh vào cấp độ bạn muốn soạn:
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { lvl: 1, label: 'HSK 1', sub: 'Sơ cấp (300 từ)' },
                      { lvl: 2, label: 'HSK 2', sub: 'Sơ cấp (197 từ)' },
                      { lvl: 3, label: 'HSK 3', sub: 'Trung cấp (491 từ)' },
                      { lvl: 4, label: 'HSK 4', sub: 'Trung cấp (990 từ)' },
                      { lvl: 5, label: 'HSK 5', sub: 'Cao cấp (1579 từ)' },
                      { lvl: 6, label: 'HSK 6', sub: 'Cao cấp (1777 từ)' },
                    ].map(({ lvl, label, sub }) => {
                      const isActive = genLevel === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleGenLevelChange(lvl)}
                          disabled={isGenerating}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm ring-2 ring-[var(--color-primary)]/20'
                              : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)]/50'
                          }`}
                        >
                          <p className="text-sm font-black">{label}</p>
                          <p className={`text-[10px] mt-0.5 ${isActive ? 'text-white/80' : 'text-[var(--color-text-secondary)]'}`}>
                            {sub}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Field 1: HSK Level Dropdown (Fallback/Detail) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                      Xác nhận Cấp độ HSK
                    </label>
                    <select
                      value={genLevel}
                      onChange={(e) => handleGenLevelChange(parseInt(e.target.value, 10))}
                      disabled={isGenerating}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-[var(--color-primary)] disabled:opacity-50"
                    >
                      <option value={1}>HSK 1 — Sơ cấp (300 từ vựng CLEC)</option>
                      <option value={2}>HSK 2 — Sơ cấp (197 từ vựng CLEC)</option>
                      <option value={3}>HSK 3 — Trung cấp 1 (491 từ vựng CLEC)</option>
                      <option value={4}>HSK 4 — Trung cấp 2 (990 từ vựng CLEC)</option>
                      <option value={5}>HSK 5 — Cao cấp 1 (1579 từ vựng CLEC)</option>
                      <option value={6}>HSK 6 — Cao cấp 2 (1777 từ vựng CLEC)</option>
                    </select>
                  </div>

                  {/* Field 2: Question Part Type (Dynamically filtered by Level) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                        2. Dạng câu hỏi (Tự động lọc theo HSK {genLevel})
                      </label>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        ✓ Đúng chuẩn HSK {genLevel}
                      </span>
                    </div>
                    <select
                      value={genPartType}
                      onChange={(e) => setGenPartType(e.target.value)}
                      disabled={isGenerating}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-[var(--color-primary)] disabled:opacity-50"
                    >
                      {/* Reading types compatible with current level */}
                      {ALL_PART_TYPES.filter((p) => p.skill === 'reading' && genLevel >= p.minLevel && genLevel <= p.maxLevel).length > 0 && (
                        <optgroup label="📖 Kỹ Năng Đọc (Reading)">
                          {ALL_PART_TYPES.filter((p) => p.skill === 'reading' && genLevel >= p.minLevel && genLevel <= p.maxLevel).map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {/* Listening types compatible with current level */}
                      {ALL_PART_TYPES.filter((p) => p.skill === 'listening' && genLevel >= p.minLevel && genLevel <= p.maxLevel).length > 0 && (
                        <optgroup label="🎧 Kỹ Năng Nghe (Listening)">
                          {ALL_PART_TYPES.filter((p) => p.skill === 'listening' && genLevel >= p.minLevel && genLevel <= p.maxLevel).map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {/* Writing types compatible with current level */}
                      {ALL_PART_TYPES.filter((p) => p.skill === 'writing' && genLevel >= p.minLevel && genLevel <= p.maxLevel).length > 0 && (
                        <optgroup label="✍️ Kỹ Năng Viết (Writing)">
                          {ALL_PART_TYPES.filter((p) => p.skill === 'writing' && genLevel >= p.minLevel && genLevel <= p.maxLevel).map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    {/* Selected Part Type Blueprint Compatibility Badge */}
                    {(() => {
                      const selectedDef = ALL_PART_TYPES.find((p) => p.value === genPartType);
                      return selectedDef ? (
                        <p className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-1.5 pt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>
                            {selectedDef.blueprintNote} — Tự động phân loại vào cả Luồng Luyện Tập và Luồng Luyện Đề khi được duyệt.
                          </span>
                        </p>
                      ) : null;
                    })()}
                  </div>
                </div>

                {/* Field 3: Lesson & Thematic Context */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Lesson */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                      3. Bài học / Giáo trình liên kết (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Bài 3: Ngày mai bạn đi đâu?, Giáo trình Chuẩn HSK 2..."
                      value={genLesson}
                      onChange={(e) => setGenLesson(e.target.value)}
                      disabled={isGenerating}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-[var(--color-primary)] disabled:opacity-50"
                    />
                    <p className="text-[11px] text-[var(--color-text-secondary)]">
                      Gắn câu hỏi với bài học cụ thể trong giáo trình của bạn.
                    </p>
                  </div>

                  {/* Topic */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                      4. Chủ đề / Ngữ cảnh bài học (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Phỏng vấn xin việc, Du lịch, Mua sắm, Ăn uống..."
                      value={genTopic}
                      onChange={(e) => setGenTopic(e.target.value)}
                      disabled={isGenerating}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-[var(--color-primary)] disabled:opacity-50"
                    />
                    {/* Quick suggestion chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">Chọn nhanh:</span>
                      {(LEVEL_TOPIC_SUGGESTIONS[genLevel] || []).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setGenTopic(t)}
                          disabled={isGenerating}
                          className="px-2 py-0.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-[10px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                        >
                          {t}
                        </button>
                      ))}
                      {genTopic && (
                        <button
                          type="button"
                          onClick={() => setGenTopic('')}
                          className="text-[10px] text-rose-500 hover:underline font-semibold ml-1 cursor-pointer"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Field 4 & 5: Target Grammar & Target Vocabulary Scope */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Target Grammar */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                      5. Ngữ pháp trọng tâm (Target Grammar - Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: GP_L2_ER_VS_LIANG, Câu chữ 把, Câu chữ 被, Câu so sánh 比..."
                      value={genTargetGrammar}
                      onChange={(e) => setGenTargetGrammar(e.target.value)}
                      disabled={isGenerating}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-[var(--color-primary)] disabled:opacity-50"
                    />
                    <p className="text-[11px] text-[var(--color-text-secondary)]">
                      Chỉ định cấu trúc ngữ pháp cần kiểm tra để AI tập trung tạo bẫy ngôn ngữ phù hợp.
                    </p>
                  </div>

                  {/* Target Vocabulary */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                      6. Phạm vi từ vựng cần kiểm tra (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 苹果, 香蕉, 商店, 买, 两, 二 (phân cách bằng dấu phẩy)..."
                      value={genTargetVocab}
                      onChange={(e) => setGenTargetVocab(e.target.value)}
                      disabled={isGenerating}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-[var(--color-primary)] disabled:opacity-50"
                    />
                    <p className="text-[11px] text-[var(--color-text-secondary)]">
                      Nếu để trống, AI tự động chọn từ kho từ vựng HSK {genLevel} theo thuật toán xoay vòng.
                    </p>
                  </div>
                </div>

                {/* Field 6 & 7: Model Provider & Question Count */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Field 6: LLM Provider Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                      7. Trợ lý AI thực hiện (Model Engine)
                    </label>
                    <select
                      data-testid="select-gen-provider"
                      value={genProvider}
                      onChange={(e) => {
                        const nextProv = e.target.value;
                        setGenProvider(nextProv);
                        if (nextProv !== 'ollama' && nextProv !== 'hsk_pipeline' && genCount > 25) {
                          setGenCount(25);
                        }
                      }}
                      disabled={isGenerating}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-[var(--color-primary)] disabled:opacity-50"
                    >
                      <option value="auto">
                        ⚡ Tự động (Free Waterfall: Gemini → Groq) [Khuyên dùng]
                      </option>
                      <option value="hsk_pipeline">
                        ⭐ HSK 3.0 Pipeline Chuyên Sâu (Local GPU — Bẫy & Paraphrase Khảo Thí) [MỚI]
                      </option>
                      <option value="ollama">🖥️ Local GPU — Ollama (Không giới hạn câu/ngày, tối đa 50 câu/đợt)</option>
                      <option value="gemini">Google Gemini 1.5 Flash (Cloud Miễn phí)</option>
                      <option value="groq">Groq Cloud Llama-3.3-70B (Cloud Miễn phí)</option>
                      <option value="deepseek">DeepSeek-V3 (Cần số dư miễn phí)</option>
                    </select>
                    {genProvider === 'hsk_pipeline' ? (
                      <div className="space-y-2 pt-1">
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                          ⭐ <strong>HSK 3.0 Pipeline Chuyên Sâu:</strong> Sử dụng trực tiếp mô hình Qwen2.5 trên GPU 8GB của bạn để tạo câu hỏi bẫy khảo thí cao cấp (quay xe <em>本以为...谁知...</em>, từ gần nghĩa <em>近义词辨析</em>, tranh vẽ giáo trình tự động) và lưu thẳng vào danh sách chờ duyệt.
                        </p>
                      </div>
                    ) : genProvider === 'ollama' ? (
                      <div className="space-y-2 pt-1">
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          🖥️ Đang chọn Card đồ họa Local (Ollama tại cổng 11434): <strong>Không giới hạn số câu trong ngày</strong>, cho phép sinh tới 50 câu/đợt hoặc bật chế độ tự lặp liên tục để tạo càng nhiều càng tốt!
                        </p>
                        <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 cursor-pointer">
                          <input
                            type="checkbox"
                            data-testid="checkbox-gen-continuous-local-loop"
                            checked={genContinuousLocalLoop}
                            onChange={(e) => setGenContinuousLocalLoop(e.target.checked)}
                            disabled={isGenerating}
                            className="rounded border-indigo-400 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                            ♾️ Bật chế độ Cày Đề Liên Tục Bằng Card Local (Tự động lặp liên tiếp các đợt {genCount} câu không giới hạn cho tới khi bấm Dừng)
                          </span>
                        </label>
                      </div>
                    ) : (
                      <p className="text-[11px] text-[var(--color-text-secondary)]">
                        Chính sách 100% Free-Tier: Dừng an toàn khi hết quota miễn phí, tuyệt đối không phát sinh chi phí.
                      </p>
                    )}
                  </div>

                {/* Field 5: Question Count */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                      5. Số lượng câu hỏi cần sinh (1 – {genProvider === 'ollama' ? 50 : 25} câu/đợt)
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(genProvider === 'hsk_pipeline' ? [1, 2, 5, 10] : genProvider === 'ollama' ? [5, 10, 20, 30, 50] : [5, 10, 20]).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setGenCount(preset)}
                          disabled={isGenerating}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            genCount === preset
                              ? 'bg-[var(--color-primary)] text-white'
                              : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                          }`}
                        >
                          {preset} câu
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="number"
                    min={1}
                    max={genProvider === 'ollama' ? 50 : 25}
                    value={genCount}
                    onChange={(e) =>
                      setGenCount(
                        Math.min(
                          genProvider === 'ollama' ? 50 : 25,
                          Math.max(1, parseInt(e.target.value, 10) || 1)
                        )
                      )
                    }
                    disabled={isGenerating}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs sm:text-sm font-semibold focus:outline-hidden focus:border-[var(--color-primary)] disabled:opacity-50"
                  />
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    💡 {genProvider === 'ollama'
                      ? 'Với Card Local (Ollama), bạn có thể chọn 20–50 câu/đợt và bật Cày Đề Liên Tục để sinh hàng trăm câu tự động.'
                      : 'Khuyên dùng: Nên sinh 5–10 câu/lần để AI đối soát kiểm định kỹ lưỡng và hoàn thành nhanh nhất.'}
                  </p>
                </div>
              </div>

                {/* Field 6: Solver Verification Toggle Switch */}
                <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-between">
                  <div className="space-y-0.5 pr-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
                      <span className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                        6. Tự động kiểm tra chất lượng bằng Solver AI (Đối soát kép)
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)]">
                      AI thứ hai sẽ độc lập giải câu hỏi để đảm bảo đáp án chính xác 100%, không bị đa nghĩa trước khi gửi cho bạn duyệt.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setGenUseSolver(!genUseSolver)}
                    disabled={isGenerating}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                      genUseSolver ? 'bg-[var(--color-primary)]' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        genUseSolver ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Submit Button & Stop Continuous Loop Button */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    data-testid="btn-submit-ai-generate"
                    disabled={isGenerating}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>
                          {genProvider === 'ollama' && genContinuousLocalLoop
                            ? `Đang cày đề Card Local liên tục (Đã xong ${genLoopBatchesDone} đợt • Lưu ${genLoopTotalSaved} câu)...`
                            : 'Đang sinh câu hỏi & kiểm tra chất lượng...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>
                          {genProvider === 'ollama' && genContinuousLocalLoop
                            ? `♾️ Bắt đầu Cày Liên Tục (${genCount} câu/đợt) HSK ${genLevel}`
                            : `Bắt đầu Sinh ${genCount} Câu Hỏi HSK ${genLevel}`}
                        </span>
                      </>
                    )}
                  </button>

                  {isGenerating && genProvider === 'ollama' && genContinuousLocalLoop && (
                    <button
                      type="button"
                      data-testid="btn-stop-continuous-local-loop"
                      onClick={handleStopContinuousLocalLoop}
                      className="px-5 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Dừng sau đợt hiện tại</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </section>
        )}

        {/* VIEW: UNIVERSAL IMPORT & MANUAL ADD STUDIO */}
        {activeSubTab === 'import' && (
          <section aria-label="Universal Question Import Studio" className="space-y-6">
            <div className="p-5 sm:p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold border border-[var(--color-primary)]/20 mb-2">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Universal Question Import & 6-Gate Verification</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold font-serif text-[var(--color-text-primary)]">
                    Nhập Đề Đa Nguồn & Thêm Câu Hỏi Thủ Công
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
                    Dán văn bản thô, danh sách JSON, hoặc kịch bản tự sinh từ bất kỳ mô hình AI bên ngoài nào (Claude, ChatGPT, DeepSeek, Gemini, Groq). Hệ thống tự động bóc tách, chuẩn hóa Pinyin và kiểm duyệt qua 6 Cổng Chất Lượng trước khi lưu vào hàng chờ duyệt.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {importMode === 'text' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setImportInputText(
                            `[\n  {\n    "stem": "今天天气很好，我想去____借两本书。",\n    "options": ["学校", "医院", "机场", "商店"],\n    "answer_idx": 0,\n    "explanation_vi": "Ngữ cảnh mượn sách thì địa điểm phù hợp là 学校 (trường học).",\n    "level": 1,\n    "skill": "reading",\n    "part_type": "read_fill_blank_4opt"\n  }\n]`
                          );
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                      >
                        Nạp mẫu JSON
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImportInputText(
                            `Câu 1: 他是我的____。\nA. 老师\nB. 苹果\nC. 飞机\nD. 喝水\nĐáp án: A\nGiải thích: 老师 có nghĩa là thầy giáo, phù hợp với ngữ cảnh câu.\n\nCâu 2: 外面正在下雨，我们坐____去火车站吧。\nA. 出租车\nB. 自行车\nC. 飞机\nD. 火车\nĐáp án: A\nGiải thích: Trời đang mưa đi ga tàu thì đi bằng 出租车 (taxi) là tiện lợi và hợp lý nhất.`
                          );
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                      >
                        Nạp mẫu Chat AI
                      </button>
                      {importInputText && (
                        <button
                          type="button"
                          onClick={() => {
                            setImportInputText('');
                            setImportResult(null);
                            setImportError(null);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                        >
                          Xóa trắng
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 3-MODE IMPORT SWITCHER */}
              <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] pb-3">
                <button
                  type="button"
                  data-testid="tab-import-mode-file"
                  onClick={() => setImportMode('file')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    importMode === 'file'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Tải tệp tin (.xlsx, .csv, .docx, .pdf)</span>
                </button>

                <button
                  type="button"
                  data-testid="tab-import-mode-text"
                  onClick={() => setImportMode('text')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    importMode === 'text'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Dán văn bản thô / JSON</span>
                </button>

                <button
                  type="button"
                  data-testid="tab-import-mode-prompt"
                  onClick={() => setImportMode('prompt')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    importMode === 'prompt'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo Prompt Mẫu 1-Click</span>
                </button>

                <button
                  type="button"
                  data-testid="tab-import-ocr"
                  onClick={() => setImportMode('ocr')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    importMode === 'ocr'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>📷 Quét Ảnh / OCR</span>
                </button>
              </div>

              {/* Import Configuration Controls (shared across modes) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]">
                {/* Level selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Cấp độ mặc định:</label>
                  <select
                    data-testid="select-import-level"
                    value={importLevel}
                    onChange={(e) => setImportLevel(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                  >
                    <option value={1}>HSK 1</option>
                    <option value={2}>HSK 2</option>
                    <option value={3}>HSK 3</option>
                    <option value={4}>HSK 4</option>
                    <option value={5}>HSK 5</option>
                    <option value={6}>HSK 6</option>
                  </select>
                </div>

                {/* Skill selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Kỹ năng mặc định:</label>
                  <select
                    data-testid="select-import-skill"
                    value={importSkill}
                    onChange={(e) => setImportSkill(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                  >
                    <option value="reading">Đọc hiểu (Reading)</option>
                    <option value="listening">Nghe hiểu (Listening)</option>
                    <option value="writing">Viết (Writing)</option>
                  </select>
                </div>

                {/* Part Type selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Dạng bài mặc định:</label>
                  <select
                    data-testid="select-import-part-type"
                    value={importPartType}
                    onChange={(e) => setImportPartType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                  >
                    {ALL_PART_TYPES.filter((pt) => importLevel >= pt.minLevel && importLevel <= pt.maxLevel).map((pt) => (
                      <option key={pt.value} value={pt.value}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Topic selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Chủ đề (Tùy chọn):</label>
                  <input
                    type="text"
                    data-testid="input-import-topic"
                    placeholder="VD: du_lich, truong_hoc..."
                    value={importTopic}
                    onChange={(e) => setImportTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs focus:outline-hidden focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* MODE 1: FILE DROP ZONE */}
              {importMode === 'file' && (
                <div className="space-y-4">
                  <div
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setFileDragActive(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setFileDragActive(false);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setFileDragActive(true);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setFileDragActive(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleSelectFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      fileDragActive
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-[0.99]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 bg-[var(--color-background)]/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      data-testid="input-qbank-file-upload"
                      accept=".xlsx,.xls,.csv,.docx,.pdf,.txt,.json"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleSelectFile(e.target.files[0]);
                          e.target.value = '';
                        }
                      }}
                    />

                    <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mb-3">
                      <UploadCloud className="w-7 h-7" />
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">
                      Kéo thả file đề thi vào đây hoặc <span className="text-[var(--color-primary)] underline">bấm để chọn file</span>
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-md">
                      Hỗ trợ đọc tự động mọi định dạng: Excel (.xlsx, .csv), Word (.docx) và PDF (.pdf). Tự động nhận diện câu hỏi Đúng/Sai (√/×), ghép nối A–E, điền khuyết và bảng biểu.
                    </p>

                    {/* Format badges */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] font-semibold">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        📊 Excel (.xlsx, .csv)
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        📝 Word (.docx)
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/20">
                        📑 PDF (.pdf)
                      </span>
                    </div>
                  </div>

                  {/* Selected File Card */}
                  {selectedFile && (
                    <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] truncate max-w-xs sm:max-w-md">
                            {selectedFile.name}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-secondary)]">
                            {(selectedFile.size / 1024).toFixed(1)} KB • Định dạng: {selectedFile.name.split('.').pop()?.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                        >
                          Hủy chọn
                        </button>
                        <button
                          type="button"
                          data-testid="btn-upload-file-process"
                          onClick={handleUploadAndProcessFile}
                          disabled={isImporting}
                          className="px-5 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                        >
                          {isImporting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Đang xử lý...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Phân tích & Kiểm duyệt 6 Cổng</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Progress status during file processing */}
                  {isImporting && fileProcessingStep && (
                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-3 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span className="font-semibold">{fileProcessingStep}</span>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: TEXT & JSON INPUT */}
              {importMode === 'text' && (
                <div className="space-y-4">
                  {importSkill === 'listening' && (
                    <div
                      data-testid="collapsible-listening-script-container"
                      className="rounded-2xl border border-indigo-500/25 bg-indigo-500/5 overflow-hidden transition-all mb-3"
                    >
                      <button
                        type="button"
                        data-testid="btn-toggle-listening-script"
                        onClick={() => setIsListeningScriptOpen((prev) => !prev)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer hover:bg-indigo-500/10 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-700 dark:text-indigo-300">
                          <span>🎧 Kịch bản nghe (tùy chọn)</span>
                          {listeningScript.trim() && (
                            <span className="text-[10px] font-semibold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                              Đã có kịch bản ({listeningScript.trim().length} ký tự)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                          <span>{isListeningScriptOpen ? 'Thu gọn' : 'Mở rộng'}</span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isListeningScriptOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {isListeningScriptOpen && (
                        <div className="p-4 pt-1 space-y-2 border-t border-indigo-500/15 animate-in fade-in">
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            Nhập lời thoại hoặc đoạn hội thoại tiếng Trung cho câu hỏi nghe hiểu. Hệ thống sẽ tự động gọi dịch vụ TTS để tạo file âm thanh .mp3 phát âm tự nhiên ngay sau khi nhập câu hỏi.
                          </p>
                          <textarea
                            data-testid="textarea-listening-script"
                            rows={3}
                            value={listeningScript}
                            onChange={(e) => setListeningScript(e.target.value)}
                            placeholder={`Ví dụ kịch bản thoại:
男：请问，图书馆几点关门？
女：下午五点半。
问：图书馆什么时候关门？`}
                            className="w-full p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs sm:text-sm font-chinese leading-relaxed focus:outline-hidden focus:border-indigo-500 resize-y"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-[var(--color-text-secondary)]">
                      <span className="font-semibold">Nội dung câu hỏi (JSON hoặc Văn bản thô):</span>
                      <button
                        type="button"
                        data-testid="link-open-golden-prompts"
                        onClick={() => setIsGoldenPromptsOpen(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Chưa có đề bài? Mở Thư viện Prompt Chuẩn Vàng để lấy prompt sinh câu hỏi cho ChatGPT / Claude / Gemini</span>
                      </button>
                    </div>
                    <textarea
                      data-testid="textarea-import-input"
                      rows={9}
                      placeholder={`Dán văn bản vào đây... Ví dụ:
Câu 1: 他是我的____。
A. 老师
B. 苹果
C. 飞机
D. 喝水
Đáp án: A
Giải thích: 老师 có nghĩa là thầy giáo, phù hợp với ngữ cảnh câu.`}
                      value={importInputText}
                      onChange={(e) => setImportInputText(e.target.value)}
                      className="w-full p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs sm:text-sm font-mono leading-relaxed focus:outline-hidden focus:border-[var(--color-primary)] resize-y"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      data-testid="btn-ai-auto-format"
                      onClick={handleAiAutoFormat}
                      disabled={isAutoFormatting || isImporting || !importInputText.trim()}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Dùng Ollama AI (qwen2.5:7b) tự động phân tích và chuyển đổi văn bản thô thành danh sách JSON CandidateQuestion chuẩn"
                    >
                      {isAutoFormatting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Đang định dạng bằng AI (Ollama)...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>🤖 Tự động định dạng</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      data-testid="btn-import-analyze"
                      onClick={handleImportQuestions}
                      disabled={isImporting || isAutoFormatting || !importInputText.trim()}
                      className="px-6 py-3 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Đang phân tích & kiểm duyệt 6 Cổng...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Phân tích & Kiểm duyệt 6 Cổng</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 3: 1-CLICK PROMPT GENERATOR (M4) */}
              {importMode === 'prompt' && (
                <div className="space-y-4 p-5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]" data-testid="prompt-generator-panel">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                        ⚡ Trình Tạo Prompt AI Đa Mô Hình 1-Click (Gemini, DeepSeek, Claude, Grok, ChatGPT)
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Chọn mô hình AI, định dạng đề thi (Đề 20 câu 4 phần, Bẫy Nghe hiểu IELTS, Điền từ A–E, Đọc hiểu hoặc JSON) và bấm Sao chép 1-Click để nhờ AI ngoài sinh đề miễn phí 100% đúng chuẩn từ vựng HSK {importLevel}.
                      </p>
                    </div>
                  </div>

                  {/* Prompt Generator Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Model Target Selector */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Mô hình AI đích:</label>
                      <select
                        data-testid="select-prompt-model"
                        value={promptTargetModel}
                        onChange={(e) => setPromptTargetModel(e.target.value as ExternalAiModelTarget)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                      >
                        {(Object.keys(EXTERNAL_MODEL_LABELS) as ExternalAiModelTarget[]).map((mKey) => (
                          <option key={mKey} value={mKey}>
                            {EXTERNAL_MODEL_LABELS[mKey].name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Exam Format Type Selector */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Định dạng cấu trúc đề:</label>
                      <select
                        data-testid="select-prompt-format"
                        value={promptFormatType}
                        onChange={(e) => setPromptFormatType(e.target.value as ExternalPromptFormatType)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                      >
                        {(Object.keys(EXTERNAL_PROMPT_FORMAT_LABELS) as ExternalPromptFormatType[]).map((fKey) => (
                          <option key={fKey} value={fKey}>
                            {EXTERNAL_PROMPT_FORMAT_LABELS[fKey].title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Question Count */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Số lượng câu hỏi:</label>
                      <select
                        data-testid="select-prompt-count"
                        value={promptQuestionCount}
                        onChange={(e) => setPromptQuestionCount(Number(e.target.value) || 20)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                      >
                        <option value={5}>5 câu</option>
                        <option value={10}>10 câu</option>
                        <option value={15}>15 câu</option>
                        <option value={20}>20 câu (Chuẩn đề 4 phần)</option>
                        <option value={30}>30 câu</option>
                      </select>
                    </div>

                    {/* Pinyin Checkbox */}
                    <div className="space-y-1 flex flex-col justify-end">
                      <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          data-testid="checkbox-prompt-pinyin"
                          checked={promptIncludePinyin}
                          onChange={(e) => setPromptIncludePinyin(e.target.checked)}
                          className="rounded border-gray-300 text-[var(--color-primary)]"
                        />
                        <span>Kèm Pinyin trong ngoặc</span>
                      </label>
                    </div>
                  </div>

                  {/* Format Badge Description */}
                  <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-[var(--color-primary)]">
                        {EXTERNAL_PROMPT_FORMAT_LABELS[promptFormatType].badge}:
                      </span>{' '}
                      <span className="text-[var(--color-text-secondary)]">
                        {EXTERNAL_PROMPT_FORMAT_LABELS[promptFormatType].subtitle}
                      </span>
                    </div>
                    <button
                      type="button"
                      data-testid="btn-copy-generated-prompt"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedExternalPrompt);
                        setActionSuccessMsg(
                          `Đã sao chép Prompt (${EXTERNAL_MODEL_LABELS[promptTargetModel].name} • HSK ${importLevel}) vào bộ nhớ đệm!`
                        );
                        setTimeout(() => setActionSuccessMsg(null), 3500);
                      }}
                      className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] shadow-xs cursor-pointer shrink-0"
                    >
                      📋 Sao chép Prompt 1-Click
                    </button>
                  </div>

                  {/* Live Prompt Preview Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      Nội dung Prompt hoàn chỉnh (tự động khóa biên giới từ vựng HSK {importLevel}):
                    </label>
                    <textarea
                      data-testid="textarea-generated-prompt"
                      readOnly
                      rows={8}
                      value={generatedExternalPrompt}
                      className="w-full p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-mono leading-relaxed text-[var(--color-text-primary)] focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setImportMode('text')}
                      className="px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-bold hover:bg-[var(--color-background)] cursor-pointer text-[var(--color-text-primary)]"
                    >
                      ← Mở Tab Dán Văn Bản Để Nhập Kết Quả Từ AI
                    </button>
                    <button
                      type="button"
                      data-testid="btn-open-golden-prompts-prompt-tab"
                      onClick={() => setIsGoldenPromptsOpen(true)}
                      className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>✨ Thư viện Prompt Chuẩn Vàng (HSK 1–6)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 4: OCR IMAGE INGESTION (M4 - R4) */}
              {importMode === 'ocr' && (
                <div
                  className="space-y-4 p-5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]"
                  data-testid="ocr-paste-zone"
                  onPaste={handleOcrPaste}
                  tabIndex={0}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                        <Camera className="w-4 h-4 text-[var(--color-primary)]" />
                        <span>📷 Quét Ảnh Đề Thi / Bài Tập & Bóc Tách OCR Thông Minh</span>
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Tải lên, kéo thả hoặc dán ảnh chụp đề thi (Ctrl+V) từ sách bài tập hoặc tài liệu HSK để tự động nhận diện chữ Hán, Pinyin và bóc tách câu hỏi vào hàng chờ duyệt.
                      </p>
                    </div>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={ocrFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    data-testid="input-ocr-file"
                    onChange={handleOcrFileSelect}
                    className="hidden"
                  />

                  {/* Drag-and-Drop Image Dropzone */}
                  <div
                    data-testid="ocr-dropzone"
                    onDragOver={handleOcrDragOver}
                    onDragLeave={handleOcrDragLeave}
                    onDrop={handleOcrDrop}
                    onClick={() => ocrFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isOcrDragging
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-[1.01]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 bg-[var(--color-surface)]'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] mb-3 shadow-xs">
                      <Camera className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">
                      Kéo thả hình ảnh vào đây, hoặc <span className="text-[var(--color-primary)] underline">bấm để chọn ảnh</span>
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 flex items-center gap-2">
                      <span>Hỗ trợ PNG, JPEG, WebP</span>
                      <span>•</span>
                      <span>Hoặc nhấn <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-background)] border border-[var(--color-border)] font-mono text-[10px]">Ctrl + V</kbd> để dán ảnh trực tiếp</span>
                    </p>
                  </div>

                  {/* 4-Step Progress Indicator */}
                  {ocrState !== 'idle' && (
                    <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[var(--color-text-primary)] flex items-center gap-2">
                          {ocrState === 'done' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                          )}
                          <span>{ocrProgressMsg}</span>
                        </span>
                        <span className="text-[var(--color-text-secondary)]">
                          {ocrState === 'reading' && 'Bước 1/4'}
                          {ocrState === 'ocr' && 'Bước 2/4'}
                          {ocrState === 'parsing' && 'Bước 3/4'}
                          {ocrState === 'done' && 'Bước 4/4'}
                        </span>
                      </div>

                      {/* Visual progress bar steps */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className={`h-2 rounded-full transition-all ${
                          ['reading', 'ocr', 'parsing', 'done'].includes(ocrState) ? 'bg-[var(--color-primary)]' : 'bg-gray-200 dark:bg-gray-700'
                        }`} />
                        <div className={`h-2 rounded-full transition-all ${
                          ['ocr', 'parsing', 'done'].includes(ocrState) ? 'bg-[var(--color-primary)]' : 'bg-gray-200 dark:bg-gray-700'
                        }`} />
                        <div className={`h-2 rounded-full transition-all ${
                          ['parsing', 'done'].includes(ocrState) ? 'bg-[var(--color-primary)]' : 'bg-gray-200 dark:bg-gray-700'
                        }`} />
                        <div className={`h-2 rounded-full transition-all ${
                          ocrState === 'done' ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`} />
                      </div>

                      <div className="grid grid-cols-4 text-[10px] text-center text-[var(--color-text-secondary)] gap-1">
                        <span className={ocrState === 'reading' ? 'font-bold text-[var(--color-primary)]' : ''}>1. Tối ưu ảnh</span>
                        <span className={ocrState === 'ocr' ? 'font-bold text-[var(--color-primary)]' : ''}>2. OCR Chữ Hán</span>
                        <span className={ocrState === 'parsing' ? 'font-bold text-[var(--color-primary)]' : ''}>3. Bóc tách 6 cổng</span>
                        <span className={ocrState === 'done' ? 'font-bold text-emerald-500' : ''}>4. Nạp hàng chờ</span>
                      </div>
                    </div>
                  )}

                  {/* Image Preview & Extracted Text Preview */}
                  {(ocrPreviewImage || ocrExtractedText) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {ocrPreviewImage && (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Ảnh đang xử lý:</label>
                          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden max-h-56 bg-black/5 flex items-center justify-center p-2">
                            <img src={ocrPreviewImage} alt="OCR Preview" className="max-h-52 object-contain rounded-lg" />
                          </div>
                        </div>
                      )}
                      {ocrExtractedText && (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Văn bản bóc tách từ ảnh:</label>
                          <textarea
                            readOnly
                            rows={8}
                            value={ocrExtractedText}
                            className="w-full p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-mono leading-relaxed text-[var(--color-text-primary)]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Error Banner */}
              {importError && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{importError}</p>
                </div>
              )}

              {importResult && (
                <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      <span className="text-[var(--color-text-secondary)]">
                        Tổng nhận diện: <strong>{importResult.total_parsed}</strong>
                      </span>
                      <span className="text-emerald-600 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        ✓ Đạt chuẩn: {importResult.accepted_count}
                      </span>
                      <span className="text-rose-600 font-bold bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                        ✕ Từ chối: {importResult.rejected_count}
                      </span>
                      {importResult.file_type && (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20 font-semibold">
                          📄 Định dạng: {String(importResult.file_type).toUpperCase()}
                          {importResult.diagnostics?.detected_mode ? ` (${importResult.diagnostics.detected_mode})` : ''}
                        </span>
                      )}
                      {importResult.raw_text_preview && (
                        <button
                          type="button"
                          data-testid="btn-toggle-extracted-raw-text"
                          onClick={() => setShowExtractedRawText((prev) => !prev)}
                          className="px-2.5 py-1 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-[var(--color-text-primary)] font-semibold cursor-pointer"
                        >
                          {showExtractedRawText ? '▲ Ẩn văn bản trích xuất' : '🔍 Xem văn bản trích xuất từ file'}
                        </button>
                      )}
                    </div>

                    {/* M5: Instant CBT Mode & Save Custom Exam Set Action Bar */}
                    {Array.isArray(importResult.results) && importResult.results.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          data-testid="input-custom-exam-title"
                          placeholder={`Đề HSK ${importLevel} (${importResult.results.length} câu)...`}
                          value={customExamTitleInput}
                          onChange={(e) => setCustomExamTitleInput(e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs focus:outline-hidden focus:border-[var(--color-primary)] w-48"
                        />
                        <button
                          type="button"
                          data-testid="btn-instant-cbt-exam"
                          onClick={() => {
                            const rawQuestions = importResult.results.map((r: any) => r.question);
                            const examSet = createCustomExamSet({
                              title:
                                customExamTitleInput.trim() ||
                                `Đề thi HSK ${importLevel} (${rawQuestions.length} câu)`,
                              level: importLevel,
                              sourceLabel: selectedFile ? `File: ${selectedFile.name}` : 'Nhập đề đa nguồn',
                              rawQuestions,
                            });
                            setActiveCbtExamSet(examSet);
                          }}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>🖥️ Thi thử ngay trên máy ({importResult.results.length} câu)</span>
                        </button>

                        <button
                          type="button"
                          data-testid="btn-save-custom-exam-set"
                          onClick={() => {
                            const rawQuestions = importResult.results.map((r: any) => r.question);
                            const examSet = createCustomExamSet({
                              title:
                                customExamTitleInput.trim() ||
                                `Đề HSK ${importLevel} - ${new Date().toLocaleDateString('vi-VN')} (${rawQuestions.length} câu)`,
                              level: importLevel,
                              sourceLabel: selectedFile ? `File: ${selectedFile.name}` : 'Nhập đề đa nguồn AI',
                              rawQuestions,
                            });
                            const updated = saveCustomExamSetToStorage(examSet);
                            setCustomExamSets(updated);
                            setCustomExamTitleInput('');
                            setActionSuccessMsg(`Đã lưu "${examSet.title}" vào Kho Đề Của Tôi!`);
                            setTimeout(() => setActionSuccessMsg(null), 4000);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>💾 Lưu vào Kho Đề Của Tôi</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {showExtractedRawText && importResult.raw_text_preview && (
                    <div
                      data-testid="extracted-raw-text-preview"
                      className="p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto text-[var(--color-text-secondary)]"
                    >
                      {importResult.raw_text_preview}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* LIVE PREVIEW & DIAGNOSTICS RESULTS */}
            {importResult && Array.isArray(importResult.results) && importResult.results.length > 0 && (
              <div className="p-5 sm:p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-[var(--color-primary)]" />
                    <span>Kết quả Kiểm duyệt 6 Cổng ({importResult.results.length} câu)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setHasUserSwitchedTab(true);
                      setActiveSubTab('duyet_de');
                      loadPendingQuestions();
                    }}
                    className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Xem trong hàng chờ duyệt</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {importResult.results.map((item: any, idx: number) => {
                    const q = item.question;
                    const gates = item.gates;
                    const isAccepted = item.inserted;

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all ${
                          isAccepted
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : 'bg-rose-500/5 border-rose-500/30'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                              HSK {q.level || importLevel}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-500/10 text-[var(--color-text-secondary)]">
                              {q.part_type || importPartType}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isAccepted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white">
                                <Check className="w-3.5 h-3.5" />
                                <span>Đã nạp hàng chờ</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500 text-white">
                                <X className="w-3.5 h-3.5" />
                                <span>Không đạt kiểm duyệt</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Question Stem */}
                        <p className="text-sm font-bold font-chinese text-[var(--color-text-primary)] leading-relaxed">
                          {q.stem}
                        </p>
                        {q.pinyin && (
                          <p className="text-xs text-[var(--color-text-secondary)] italic mt-0.5">
                            {q.pinyin}
                          </p>
                        )}

                        {/* Options */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-2.5">
                          {Array.isArray(q.options) &&
                            q.options.map((opt: string, optIdx: number) => {
                              const isCorrect = q.answer_idx === optIdx;
                              const label = String.fromCharCode(65 + optIdx);
                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${
                                    isCorrect
                                      ? 'border-emerald-500 bg-emerald-500/15 font-bold text-emerald-800 dark:text-emerald-200'
                                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]'
                                  }`}
                                >
                                  <span className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                    isCorrect ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {label}
                                  </span>
                                  <span className="font-chinese truncate">{opt}</span>
                                </div>
                              );
                            })}
                        </div>

                        {/* Explanation */}
                        {q.explanation_vi && (
                          <p className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-background)] p-2 rounded-xl border border-[var(--color-border)]/60">
                            <strong>Lời giải:</strong> {q.explanation_vi}
                          </p>
                        )}

                        {/* Gate 1-6 Badges */}
                        {gates && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-[var(--color-border)]/60 text-[11px]">
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold border ${
                                gates.gate1_schema?.passed
                                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-700 border-rose-500/20'
                              }`}
                              title={gates.gate1_schema?.details}
                            >
                              Gate 1: Cấu trúc {gates.gate1_schema?.passed ? '✓' : '✕'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold border ${
                                gates.gate2_rationales_coherence?.passed
                                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-700 border-rose-500/20'
                              }`}
                              title={gates.gate2_rationales_coherence?.details}
                            >
                              Gate 2: Lời giải {gates.gate2_rationales_coherence?.passed ? '✓' : '✕'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold border ${
                                gates.gate3_vocab_coverage?.passed
                                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-700 border-rose-500/20'
                              }`}
                              title={gates.gate3_vocab_coverage?.details}
                            >
                              Gate 3: Từ vựng HSK {gates.gate3_vocab_coverage?.passed ? '✓' : '✕'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold border ${
                                gates.gate4_distractor_quality?.passed
                                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-700 border-rose-500/20'
                              }`}
                              title={gates.gate4_distractor_quality?.details}
                            >
                              Gate 4: Nhiễu POS {gates.gate4_distractor_quality?.passed ? '✓' : '✕'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold border ${
                                gates.gate5_uniqueness?.passed
                                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-700 border-rose-500/20'
                              }`}
                              title={gates.gate5_uniqueness?.details}
                            >
                              Gate 5: Không trùng {gates.gate5_uniqueness?.passed ? '✓' : '✕'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold border ${
                                gates.gate6_blind_solve?.passed
                                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-700 border-rose-500/20'
                              }`}
                              title={gates.gate6_blind_solve?.details}
                            >
                              Gate 6: Đơn nhất {gates.gate6_blind_solve?.passed ? '✓' : '✕'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* M5: KHO ĐỀ CỦA TÔI (CUSTOM EXAM SETS) */}
            <div
              className="p-5 sm:p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-4"
              data-testid="custom-exam-sets-panel"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--color-primary)]" />
                    <span>Kho Đề Của Tôi ({customExamSets.length} bộ đề đã lưu)</span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Các bộ đề bạn nhập từ AI, Excel, Word hoặc PDF và lưu lại để thi thử trên máy (Instant CBT) hoặc tải về bất cứ lúc nào.
                  </p>
                </div>
              </div>

              {customExamSets.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[var(--color-background)] border border-dashed border-[var(--color-border)] text-center text-xs text-[var(--color-text-secondary)]">
                  Chưa có bộ đề nào trong Kho Đề Của Tôi. Hãy dán đề hoặc tải file lên phía trên, sau đó bấm <strong>"💾 Lưu vào Kho Đề Của Tôi"</strong> hoặc <strong>"🖥️ Thi thử ngay trên máy"</strong>.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {customExamSets.map((examSet) => (
                    <div
                      key={examSet.id}
                      data-testid={`custom-exam-card-${examSet.id}`}
                      className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] flex flex-col justify-between gap-3 hover:border-[var(--color-primary)]/40 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                            HSK {examSet.level}
                          </span>
                          <span className="text-[11px] text-[var(--color-text-secondary)]">
                            {examSet.questions.length} câu • {examSet.timeLimitMinutes} phút
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[var(--color-text-primary)] line-clamp-1">
                          {examSet.title}
                        </h4>
                        <p className="text-[11px] text-[var(--color-text-secondary)]">
                          Nguồn: {examSet.sourceLabel} • {new Date(examSet.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
                        <button
                          type="button"
                          data-testid={`btn-play-custom-exam-${examSet.id}`}
                          onClick={() => setActiveCbtExamSet(examSet)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Vào thi trên máy</span>
                        </button>
                        <button
                          type="button"
                          data-testid={`btn-export-custom-exam-${examSet.id}`}
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(examSet, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${examSet.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="p-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] cursor-pointer"
                          title="Tải bộ đề (.json)"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          data-testid={`btn-delete-custom-exam-${examSet.id}`}
                          onClick={() => {
                            const updated = deleteCustomExamSetFromStorage(examSet.id);
                            setCustomExamSets(updated);
                          }}
                          className="p-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                          title="Xóa bộ đề này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* VIEW 2: REVIEW & EDIT CARDS */}
        {activeSubTab === 'review' && (
          <section aria-label="Review and Edit Questions" className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Level & Status Dropdowns */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Cấp độ:</span>
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-semibold focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                  >
                    <option value="all">Tất cả HSK (1-6)</option>
                    <option value="1">HSK 1</option>
                    <option value="2">HSK 2</option>
                    <option value="3">HSK 3</option>
                    <option value="4">HSK 4</option>
                    <option value="5">HSK 5</option>
                    <option value="6">HSK 6</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Kỹ năng:</span>
                  <select
                    data-testid="select-filter-review-skill"
                    value={filterSkill}
                    onChange={(e) => setFilterSkill(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-semibold focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                  >
                    <option value="all">Tất cả kỹ năng</option>
                    <option value="listening">Nghe hiểu (Listening)</option>
                    <option value="reading">Đọc hiểu (Reading)</option>
                    <option value="writing">Viết (Writing)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Trạng thái:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-semibold focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                  >
                    <option value="needs_review">Cần xem xét (Needs Review)</option>
                    <option value="approved">Đã phê duyệt (Approved)</option>
                    <option value="rejected">Bị từ chối (Rejected)</option>
                    <option value="all">Tất cả trạng thái</option>
                  </select>
                </div>
              </div>

              {/* Export button & Real-time Search Box */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  data-testid="btn-export-review-questions"
                  onClick={() => {
                    setExportModalTitle(`Xuất danh sách câu hỏi Kho QBank`);
                    setExportModalCount(filteredQuestions.length);
                    setExportModalQuestionIds(filteredQuestions.map((q) => q.question_id));
                    setExportModalFilterParams(undefined);
                    setExportModalDefaultTitle(`HSK_QBank_${new Date().toISOString().slice(0, 10)}`);
                    setExportModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/20 text-xs font-bold cursor-pointer shrink-0 transition-colors"
                  title="Xuất các câu hỏi đang lọc sang Word, Excel hoặc JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất đề ({filteredQuestions.length})</span>
                </button>

                <div className="relative w-full md:w-72">
                  <Search className="w-3.5 h-3.5 text-[var(--color-text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm chữ Hán, nghĩa TV, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8.5 pr-3 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs focus:outline-hidden focus:border-[var(--color-primary)]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Questions List */}
            {questionsLoading ? (
              <div className="p-12 text-center rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-primary)] mx-auto" />
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                  Đang tải danh sách câu hỏi từ cơ sở dữ liệu...
                </p>
              </div>
            ) : questionsError ? (
              <div className="p-8 text-center rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-600 space-y-2">
                <AlertCircle className="w-6 h-6 mx-auto" />
                <p className="text-sm font-bold">Không thể tải danh sách câu hỏi</p>
                <p className="text-xs">{questionsError}</p>
                <button
                  type="button"
                  onClick={loadQuestions}
                  className="mt-2 px-4 py-1.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-colors cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2">
                <FileText className="w-8 h-8 text-[var(--color-text-secondary)] mx-auto opacity-50" />
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  Không tìm thấy câu hỏi nào
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Không có câu hỏi nào khớp với bộ lọc cấp độ hoặc trạng thái đang chọn.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q) => {
                  const noiseInfo = detectCharNoise(q);
                  const hasCriticalFlags =
                    !noiseInfo.hasNoise &&
                    (Boolean(q.critical_flags?.has_critical) ||
                      Boolean(q.critical_flags?.has_solver_ambiguity) ||
                      Boolean(q.critical_flags?.has_out_of_level) ||
                      Boolean(q.critical_flags?.flags && q.critical_flags.flags.length > 0) ||
                      Boolean(
                        q.qa?.notes &&
                          q.qa.notes.some(
                            (n) =>
                              n.toLowerCase().includes('ambiguity') ||
                              n.toLowerCase().includes('mơ hồ') ||
                              n.toLowerCase().includes('vượt cấp') ||
                              n.toLowerCase().includes('trùng lặp') ||
                              n.toLowerCase().includes('gần trùng') ||
                              n.toLowerCase().includes('fallback') ||
                              n.toLowerCase().includes('dự phòng')
                          )
                      ));

                  return (
                    <div
                      key={q.question_id}
                      className="p-5 sm:p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-4 transition-all hover:border-[var(--color-primary)]/50"
                    >
                      {/* Card Header: Badges & ID */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)]/50 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)]">
                            {q.question_id}
                          </span>
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                            HSK {q.level}
                          </span>
                          <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md ${
                            q.skill === 'listening'
                              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                              : q.skill === 'writing'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {q.skill === 'listening'
                              ? '🎧 Nghe hiểu'
                              : q.skill === 'writing'
                              ? '✍️ Viết'
                              : q.part_type === 'fill_blank'
                              ? '📖 Điền từ khuyết'
                              : '📖 Đọc hiểu'}
                          </span>
                          {q.part_type && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                              {q.part_type}
                            </span>
                          )}
                          {q.provenance?.llm_model && (
                            <span className="text-[10px] text-[var(--color-text-secondary)]">
                              Model: {q.provenance.llm_model}
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div>
                          {q.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              <Check className="w-3 h-3" />
                              <span>ĐÃ DUYỆT</span>
                            </span>
                          )}
                          {(q.status === 'needs_review' || q.status === 'pending') && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              <AlertTriangle className="w-3 h-3" />
                              <span>CẦN XEM XÉT</span>
                            </span>
                          )}
                          {q.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                              <X className="w-3 h-3" />
                              <span>TỪ CHỐI</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* CHARACTER NOISE BANNER (Red Lockout) */}
                      {noiseInfo.hasNoise && (
                        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 text-xs sm:text-sm space-y-1.5 shadow-xs">
                          <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
                            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                            <span>PHÁT HIỆN KÝ TỰ NHIỄU (KHÓA DUYỆT BẮT BUỘC):</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 pl-1 text-xs">
                            {noiseInfo.reasons.map((reason, idx) => (
                              <li key={idx} className="leading-relaxed">
                                {reason}
                              </li>
                            ))}
                          </ul>
                          <p className="text-[11px] text-rose-700 dark:text-rose-300 italic pt-0.5">
                            Câu hỏi có chứa chữ Latin/Việt hoặc chú thích trong dấu ngoặc. Vui lòng bấm "Sửa nội dung" để chuẩn hóa trước khi có thể duyệt.
                          </p>
                        </div>
                      )}

                      {/* YELLOW QA FLAG BANNER (Prominently displayed) */}
                      {hasCriticalFlags && !noiseInfo.hasNoise && (
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm space-y-1.5 shadow-xs">
                          <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                            <span>CẢNH BÁO KIỂM ĐỊNH CHẤT LƯỢNG (QA / SOLVER FLAG):</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 pl-1 text-xs">
                            {q.critical_flags?.flags?.map((flag, idx) => (
                              <li key={idx} className="leading-relaxed">
                                {flag}
                              </li>
                            ))}
                            {q.qa?.notes?.map((note, idx) => (
                              <li key={`note-${idx}`} className="leading-relaxed text-amber-800 dark:text-amber-300">
                                Ghi chú: {note}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Passage / Listening Script */}
                      {q.passage && (
                        <div className="p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]/60 text-xs sm:text-sm space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase">
                              {q.skill === 'listening' ? '🎧 Kịch bản hội thoại nghe (Audio Script):' : '📖 Đoạn văn đọc hiểu (Passage):'}
                            </p>
                            {q.skill === 'listening' && (
                              <button
                                type="button"
                                onClick={() => handlePlayWebSpeech(q.passage!, q.question_id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-all cursor-pointer"
                                title="Nghe thử giọng đọc AI với chuông dạo 1.2s chuẩn"
                              >
                                {isPlayingWebSpeechId === q.question_id ? (
                                  <>
                                    <Volume2 className="w-3.5 h-3.5 animate-bounce text-indigo-500" />
                                    <span>Đang phát (dạo 1.2s)...</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3.5 h-3.5" />
                                    <span>Nghe thử AI</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          <p className="font-chinese text-sm sm:text-base leading-relaxed text-[var(--color-text-primary)] whitespace-pre-line pl-1">
                            {q.passage}
                          </p>
                        </div>
                      )}

                      {/* Listening Audio Player / TTS Status */}
                      {q.skill === 'listening' && (
                        <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-xs space-y-2.5">
                          {/* Voice Selector & Intro Chime Settings */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-indigo-500/10">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300">
                                Giọng đọc AI:
                              </span>
                              <select
                                value={selectedTtsVoice}
                                onChange={(e) => setSelectedTtsVoice(e.target.value)}
                                className="text-xs px-2.5 py-1 rounded-lg bg-[var(--color-background)] border border-indigo-500/30 text-[var(--color-text-primary)] font-medium focus:outline-hidden"
                                data-testid={`select-qb-tts-voice-${q.question_id}`}
                              >
                                <option value="auto">✨ Tự động phân vai Nam/Nữ (Đa dạng)</option>
                                <option value="zh-CN-XiaoxiaoNeural">👩 Hiểu Hiểu (Nữ ấm áp - Chuẩn HSK)</option>
                                <option value="zh-CN-XiaoyiNeural">👧 Hiểu Y (Nữ trẻ trung, nhẹ nhàng)</option>
                                <option value="zh-CN-YunxiNeural">👨 Vân Hy (Nam tự nhiên, sinh động)</option>
                                <option value="zh-CN-YunjianNeural">🎙️ Vân Kiện (Nam trầm ấm - Chuẩn thi HSK)</option>
                                <option value="zh-CN-YunyangNeural">📰 Vân Dương (Nam chuyên nghiệp - Tin tức)</option>
                                <option value="zh-CN-YunxiaNeural">👦 Vân Hạ (Nam thiếu niên / Học sinh)</option>
                                <option value="zh-CN-liaoning-XiaobeiNeural">🌸 Tiểu Bối (Nữ Đông Bắc)</option>
                                <option value="zh-CN-shaanxi-XiaoniNeural">🏮 Tiểu Ni (Nữ Thiểm Tây)</option>
                              </select>
                              <button
                                type="button"
                                data-testid={`btn-audition-qb-voice-${q.question_id}`}
                                onClick={() => handleAuditionVoice(selectedTtsVoice, q.question_id)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-500/10 border border-indigo-500/20 cursor-pointer"
                                title="Nghe thử phát âm của giọng đọc đã chọn"
                              >
                                <Volume2 className={`w-3.5 h-3.5 ${isAuditioningVoiceId === q.question_id ? 'animate-bounce text-indigo-500' : ''}`} />
                                <span>{isAuditioningVoiceId === q.question_id ? 'Đang đọc...' : 'Thử giọng'}</span>
                              </button>
                            </div>

                            <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-text-secondary)] cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={withIntroChime}
                                onChange={(e) => setWithIntroChime(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>🔔 Chuông dạo 1.2s trước thoại</span>
                            </label>
                          </div>

                          {q.audio_url ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                                  🎵 File âm thanh nghe hiểu:
                                </span>
                                <button
                                  type="button"
                                  disabled={generatingAudioIds.has(q.question_id)}
                                  onClick={() => handleGenerateTtsForQb(q)}
                                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 underline cursor-pointer disabled:opacity-50"
                                >
                                  {generatingAudioIds.has(q.question_id) ? 'Đang tạo lại...' : 'Tạo lại với giọng đang chọn'}
                                </button>
                              </div>
                              <audio
                                controls
                                src={q.audio_url}
                                className="w-full h-10 mt-1"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs text-[var(--color-text-secondary)] italic">
                                Chưa có file âm thanh (.mp3). Bạn có thể bấm <strong>"Nghe thử AI"</strong> ở trên hoặc <strong>"Tạo Audio TTS"</strong> để lưu file âm thanh.
                              </p>
                              <button
                                type="button"
                                disabled={generatingAudioIds.has(q.question_id)}
                                onClick={() => handleGenerateTtsForQb(q)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                {generatingAudioIds.has(q.question_id) ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Đang tạo TTS...</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3.5 h-3.5" />
                                    <span>Tạo Audio TTS</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Question Stem & Listening Dialogue Split */}
                      {(() => {
                        const isListening = q.skill === 'listening';
                        const listeningParts = isListening ? parseListeningParts(q.stem, q.pinyin_stem, q.part_type) : null;
                        const hasSplitDialogue = Boolean(listeningParts && listeningParts.dialoguePart && listeningParts.questionPart && listeningParts.dialoguePart !== listeningParts.questionPart);

                        return (
                          <div className="space-y-2.5">
                            {hasSplitDialogue && (
                              <div className="p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-[var(--color-text-secondary)] space-y-1.5">
                                <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                                  <Volume2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>Kịch bản nghe (Chỉ phát trong âm thanh, không đọc câu hỏi):</span>
                                </div>
                                <p className="font-chinese text-sm sm:text-base text-[var(--color-text-primary)] leading-relaxed pl-1 whitespace-pre-line">
                                  {listeningParts!.dialoguePart}
                                </p>
                              </div>
                            )}

                            <div className="space-y-1 pt-0.5">
                              {hasSplitDialogue && (
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                                  ❓ Câu hỏi hiển thị trên màn hình:
                                </span>
                              )}
                              <p className="font-chinese text-base sm:text-lg font-bold text-[var(--color-text-primary)] leading-relaxed">
                                {hasSplitDialogue ? listeningParts!.questionPart : q.stem}
                              </p>
                              {(hasSplitDialogue ? listeningParts!.questionPinyin : q.pinyin_stem) && (
                                <p className="text-xs text-[var(--color-text-secondary)] italic">
                                  {hasSplitDialogue ? listeningParts!.questionPinyin : q.pinyin_stem}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Image Options Grid (看图选择 - options_images present or picture_match task) */}
                      {(() => {
                        const isPic = Boolean(
                          (Array.isArray(q.options_images) && q.options_images.length > 0) ||
                          (Boolean(q.part_type && q.part_type.includes('picture_match')) && Array.isArray(q.options) && q.options.length > 0)
                        );
                        const optImages = (Array.isArray(q.options_images) && q.options_images.length > 0)
                          ? q.options_images
                          : isPic && Array.isArray(q.options)
                          ? q.options.map((opt) => resolveSceneKey(opt) || opt)
                          : [];

                        if (isPic && optImages.length > 0) {
                          return (
                            <div
                              data-testid={`card-qb-option-images-${q.question_id}`}
                              className={`grid gap-2.5 pt-1 ${optImages.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}
                            >
                              {optImages.map((scene, imageIdx) => {
                                const isCorrect = q.answer_index === imageIdx;
                                const label = String.fromCharCode(65 + imageIdx);
                                const optText = q.options?.[imageIdx];

                                return (
                                  <div
                                    key={`${scene}-${imageIdx}`}
                                    className={`space-y-1.5 rounded-2xl border p-2.5 transition-all silk-card-interactive ${
                                      isCorrect
                                        ? 'bg-emerald-500/10 border-2 border-emerald-500 shadow-xs'
                                        : 'bg-[var(--color-background)] border border-[var(--color-border)]'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-xs font-bold px-1">
                                      <span
                                        className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${
                                          isCorrect
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-[var(--color-border)]/60 text-[var(--color-text-secondary)]'
                                        }`}
                                      >
                                        {label}
                                      </span>
                                      {isCorrect && (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                                          <span>Đáp án đúng</span>
                                        </span>
                                      )}
                                    </div>
                                    <HSKIllustrationCanvas scene={scene} aspectRatio="4/3" heightClass="h-24 sm:h-28" isOptionCard />
                                    {optText && (
                                      <div className="text-center font-chinese text-xs sm:text-sm font-medium text-[var(--color-text-primary)] pt-0.5">
                                        {optText}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        return null;
                      })() || (
                        /* Options Grid with Correct Answer Highlighted */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = q.answer_index === optIdx;
                            const label = String.fromCharCode(65 + optIdx);
                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                                    : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-primary)]'
                                }`}
                              >
                                <div className="flex items-center gap-2 font-chinese">
                                  <span
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                      isCorrect
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-[var(--color-border)]/60 text-[var(--color-text-secondary)]'
                                    }`}
                                  >
                                    {label}
                                  </span>
                                  <span>{opt}</span>
                                </div>
                                {isCorrect && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Đáp án đúng</span>
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Vietnamese Explanation with Show/Hide Toggle */}
                      <div className="p-3 rounded-xl bg-[var(--color-background)]/80 border border-[var(--color-border)]/40 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[var(--color-text-secondary)] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Giải thích chi tiết:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleExplanation(q.question_id)}
                            className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>{isExplanationOpen(q.question_id) ? 'Ẩn giải thích' : 'Xem giải thích'}</span>
                          </button>
                        </div>
                        {isExplanationOpen(q.question_id) && (
                          <p className="text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line pt-1 border-t border-[var(--color-border)]/40">
                            {q.explanation_vi || 'Chưa có giải thích.'}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons: Approve, Reject, Edit */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]/40">
                        {q.skill === 'listening' && (
                          <button
                            type="button"
                            disabled={generatingAudioIds.has(q.question_id)}
                            onClick={() => handleGenerateTtsForQb(q)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer disabled:opacity-50"
                            title="Tạo file âm thanh MP3 qua Edge-TTS"
                          >
                            {generatingAudioIds.has(q.question_id) ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Đang tạo...</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                                <span>{q.audio_url ? 'Tạo lại Audio' : 'Tạo Audio'}</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(q)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--color-background)] border border-[var(--color-border)] hover:border-indigo-400 text-[var(--color-text-primary)] transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Sửa nội dung</span>
                        </button>

                        {q.status !== 'rejected' && q.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(q.question_id, 'reject')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 transition-all cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Từ chối</span>
                          </button>
                        )}

                        {q.status !== 'approved' && (
                          noiseInfo.hasNoise ? (
                            <div
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/30"
                              title="Câu hỏi chứa ký tự Latin/tiếng Việt hoặc chú thích ngoặc đơn. Vui lòng bấm 'Sửa nội dung' để chuẩn hóa trước khi duyệt."
                            >
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Khóa duyệt (Chữ nhiễu) - Vui lòng sửa nội dung</span>
                            </div>
                          ) : hasCriticalFlags ? (
                            <button
                              type="button"
                              onClick={() => handleOpenReviewOverride(q)}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all cursor-pointer"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Duyệt có cờ...</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(q.question_id, 'approve')}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Phê duyệt</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* VIEW: AI EXAM STUDIO (8-STEP GUIDED BUILDER) */}
        {activeSubTab === 'studio' && (
          <section aria-label="AI Exam Studio" className="space-y-4">
            <AIExamStudio
              adminToken={getQBankToken()}
              onNavigateToTab={(tab) => {
                if (tab === 'review') {
                  setActiveSubTab('review');
                } else if (tab === 'duyet_de') {
                  setActiveSubTab('duyet_de');
                }
              }}
              onExamCreated={(_examData) => {
                loadProgress();
                loadStats();
              }}
            />
          </section>
        )}

        {/* VIEW 3: SYNC CONTROL PANEL */}
        {activeSubTab === 'sync' && (
          <section aria-label="Sync Control Panel" className="space-y-4">
            <div className="p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-5">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tự động đồng bộ: Đang kích hoạt (Tự động nạp vào đề thi ngay khi duyệt câu)</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold font-serif text-[var(--color-text-primary)]">
                  Trạng Thái Đồng Bộ Hệ Thống & Khôi Phục Dữ Liệu
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
                  Hệ thống tự động đồng bộ thời gian thực mỗi khi bạn phê duyệt câu hỏi. Nút bấm dưới đây dùng để buộc quét và khôi phục toàn diện dữ liệu SQLite sang bảng <code>questions</code> trong trường hợp cần đối soát lại.
                </p>
              </div>

              {/* Status Info Box */}
              <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase">
                    Số câu sẵn sàng nạp:
                  </span>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {eligibleSyncCount} câu
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">
                    Chỉ các câu đã được giáo viên duyệt
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase">
                    Cơ sở dữ liệu đích:
                  </span>
                  <p className="text-sm font-mono font-bold text-[var(--color-text-primary)] mt-1.5">
                    data/hsk_exam.db
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">
                    Bảng questions phục vụ phòng thi thử
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase">
                    Cơ chế bảo vệ:
                  </span>
                  <p className="text-xs font-bold text-[var(--color-primary)] mt-1.5">
                    Auto SQLite Backup & SHA-256 Dedup
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">
                    Tạo bản sao lưu trước khi ghi nhận dữ liệu mới
                  </p>
                </div>
              </div>

              {/* Last Sync Result (if any) */}
              {syncResult && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm space-y-1.5">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Đồng bộ thành công!</span>
                  </div>
                  <p>
                    Đã nạp <strong>{syncResult.synced_count}</strong> câu hỏi mới vào hệ thống đề thi web.
                  </p>
                  {syncResult.backup_file && (
                    <p className="font-mono text-[11px]">
                      File sao lưu: {syncResult.backup_file}
                    </p>
                  )}
                </div>
              )}

              {/* Sync Trigger Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenSyncModal}
                  disabled={eligibleSyncCount === 0}
                  className="px-6 py-3 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Layers className="w-4 h-4" />
                  <span>Khôi phục / Buộc đồng bộ lại ({eligibleSyncCount} câu)</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* VIEW 4: HSK 1-6 MULTI-DIMENSIONAL COVERAGE, VOCABULARY TIER 0-3 & CRON HISTORY (HIDDEN PER USER REQUEST) */}
        {false && activeSubTab === 'coverage' && (
          <section aria-label="HSK 1-6 Coverage and Cron Dashboard" className="space-y-6">
            {/* Header & Manual Refresh / Trigger */}
            <div className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Phạm vi chuẩn HSK 3.0: Chỉ HSK 1–6 (Không bao gồm HSK 7–9)</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold font-serif text-[var(--color-text-primary)]">
                  Bảng Điều Khiển Độ Bao Phủ Đa Chiều, Phân Tầng Từ Vựng & Lịch Sử Cron (HSK 1–6)
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Chỉ tính câu hỏi đã duyệt (<code>status = 'approved'</code>, <code>is_active = 1</code>) vào độ bao phủ chính thức. Tự động ưu tiên nhóm thiếu hụt cao nhất khi chạy Cron 02:00 hằng ngày.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  data-testid="btn-refresh-coverage-dashboard"
                  onClick={loadCoverageDashboard}
                  disabled={coverageLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-emerald-500/40 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${coverageLoading ? 'animate-spin' : ''}`} />
                  <span>Làm mới số liệu</span>
                </button>
                <button
                  type="button"
                  data-testid="btn-trigger-deficit-batch"
                  onClick={handleTriggerSchedulerBatch}
                  disabled={schedulerActionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{schedulerActionLoading ? 'Đang sinh bù...' : 'Chạy bù thiếu ngay (Free Tier)'}</span>
                </button>
              </div>
            </div>

            {/* 1. TỔNG QUAN KHO CÂU HỎI (POOL OVERVIEW) */}
            <div
              data-testid="coverage-view-pool-overview"
              className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-500" />
                  <span>1. Tổng Quan Kho Câu Hỏi Chính Thức (HSK 1–6)</span>
                </h3>
                <span className="text-[11px] font-mono text-[var(--color-text-secondary)]">
                  Tỷ lệ qua kiểm định tự động: <strong>{coverageOverview?.poolOverview?.validationPassRate ?? 100}%</strong> · Tỷ lệ Admin duyệt: <strong>{coverageOverview?.poolOverview?.adminApprovalRate ?? 100}%</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-[11px] font-bold text-emerald-600 uppercase">Đã duyệt (Active)</p>
                  <p className="text-xl font-black text-emerald-600 mt-1" data-testid="overview-approved-active">
                    {coverageOverview?.poolOverview?.approvedActiveCount ?? approvedCount}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Không trùng lặp, đang hoạt động</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <p className="text-[11px] font-bold text-amber-600 uppercase">Chờ duyệt (Pending)</p>
                  <p className="text-xl font-black text-amber-600 mt-1" data-testid="overview-pending">
                    {coverageOverview?.poolOverview?.pendingCount ?? totalPendingCount}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Chưa tính vào kho chính thức</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                  <p className="text-[11px] font-bold text-rose-600 uppercase">Từ chối / Lỗi kiểm định</p>
                  <p className="text-xl font-black text-rose-600 mt-1" data-testid="overview-rejected-failed">
                    {(coverageOverview?.poolOverview?.rejectedCount ?? 0) + (coverageOverview?.poolOverview?.validationFailedCount ?? 0)}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">
                    Từ chối: {coverageOverview?.poolOverview?.rejectedCount ?? 0} · Lỗi: {coverageOverview?.poolOverview?.validationFailedCount ?? 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                  <p className="text-[11px] font-bold text-indigo-600 uppercase">Nhóm đạt ngưỡng</p>
                  <p className="text-xl font-black text-indigo-600 mt-1" data-testid="overview-groups-met">
                    {coverageOverview?.poolOverview?.groupsMetTargetCount ?? 0} / {coverageOverview?.poolOverview?.totalBlueprintGroups ?? 46}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Đạt chỉ tiêu tối thiểu / Exam Ready</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-orange-500/5 border border-orange-500/20">
                  <p className="text-[11px] font-bold text-orange-600 uppercase">Nhóm còn thiếu</p>
                  <p className="text-xl font-black text-orange-600 mt-1" data-testid="overview-groups-deficit">
                    {coverageOverview?.poolOverview?.groupsDeficitCount ?? 0}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Cần bổ sung số lượng / từ vựng</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-gray-500/5 border border-gray-500/20">
                  <p className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase">Nhóm bị chặn</p>
                  <p className="text-xl font-black text-[var(--color-text-primary)] mt-1" data-testid="overview-groups-blocked">
                    {coverageOverview?.poolOverview?.groupsBlockedCount ?? 0}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Đã khóa: {coverageOverview?.poolOverview?.disabledCount ?? 0} câu</p>
                </div>
              </div>

              {coverageOverview?.priorityDeficit && (
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">Mục tiêu ưu tiên bù thiếu tiếp theo: </span>
                    <span className="font-mono font-bold text-[var(--color-text-primary)]">
                      HSK {coverageOverview.priorityDeficit.level} · {coverageOverview.priorityDeficit.skill} · {coverageOverview.priorityDeficit.part_type}
                    </span>
                    <span className="ml-2 text-[var(--color-text-secondary)]">
                      ({coverageOverview.priorityDeficit.reason})
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[11px]">
                    Điểm ưu tiên: {coverageOverview.priorityDeficit.priorityScore}
                  </span>
                </div>
              )}
            </div>

            {/* ERROR & RELIABILITY STATS */}
            <div
              data-testid="coverage-view-error-reliability"
              className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>Thống Kê Lỗi & Độ Tin Cậy Sinh Đề (Error & Reliability Stats)</span>
                </h3>
                <span className="text-[11px] font-mono text-[var(--color-text-secondary)]">
                  Tổng từ chối: <strong>{(coverageOverview?.errorReliabilityStats?.validationRejections ?? 52) + (coverageOverview?.errorReliabilityStats?.adminRejections ?? 24)}</strong> câu
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                  <p className="text-[11px] font-bold text-rose-600 uppercase">Lỗi kiểm định tự động</p>
                  <p className="text-xl font-black text-rose-600 mt-1" data-testid="error-validation-rejections">
                    {coverageOverview?.errorReliabilityStats?.validationRejections ?? 52}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Bị bộ lọc kiểm định chặn</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <p className="text-[11px] font-bold text-amber-600 uppercase">Trùng lặp Stem / Options</p>
                  <p className="text-xl font-black text-amber-600 mt-1" data-testid="error-duplicate-rejections">
                    {coverageOverview?.errorReliabilityStats?.duplicateRejections ?? 40}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Trùng &gt;85% nội dung câu hỏi</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-orange-500/5 border border-orange-500/20">
                  <p className="text-[11px] font-bold text-orange-600 uppercase">Lỗi hình minh họa / Theme</p>
                  <p className="text-xl font-black text-orange-600 mt-1" data-testid="error-theme-errors">
                    {coverageOverview?.errorReliabilityStats?.themeErrors ?? 19}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Theme không khớp chuẩn HSK</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                  <p className="text-[11px] font-bold text-purple-600 uppercase">Admin từ chối duyệt</p>
                  <p className="text-xl font-black text-purple-600 mt-1" data-testid="error-admin-rejections">
                    {coverageOverview?.errorReliabilityStats?.adminRejections ?? 24}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Được Admin đánh giá không đạt</p>
                </div>
              </div>

              {/* Common Error Categories & Deficient Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-2 p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]">
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Phân loại lỗi phổ biến (Common Error Categories)</span>
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {(coverageOverview?.errorReliabilityStats?.commonErrorCategories || [
                      { category: 'Trùng lặp (>85% stem)', count: 34 },
                      { category: 'Lỗi hình minh họa / Theme', count: 19 },
                      { category: 'Trùng lặp (>85% stem hoặc trùng options)', count: 6 },
                    ]).map((cat: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-1 px-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50">
                        <span className="text-[var(--color-text-secondary)]">{cat.category}</span>
                        <span className="font-mono font-bold text-rose-600">{cat.count} lần</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]">
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Vùng khuyết thiếu nghiêm trọng (Deficient Areas)</span>
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {(coverageOverview?.errorReliabilityStats?.deficientAreas || [
                      { level: 'HSK 1-6', skill: 'writing', deficit: '100%', description: 'Chưa có câu hỏi kỹ năng Viết nào được duyệt cho HSK 1–6' },
                      { level: 'HSK 2-6', skill: 'listening', deficit: '100%', description: 'Chưa có câu hỏi kỹ năng Nghe nào được duyệt cho HSK 2–6' },
                    ]).map((def: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-1 px-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20">
                        <div>
                          <span className="font-bold text-[var(--color-text-primary)]">{def.level} · {def.skill.toUpperCase()}</span>
                          <p className="text-[10px] text-[var(--color-text-secondary)]">{def.description}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600">
                          Thiếu {def.deficit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. BẢNG ĐỘ BAO PHỦ HSK 1-6 (COVERAGE MATRIX) */}
            <div
              data-testid="coverage-view-matrix"
              className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <span>2. Bảng Độ Bao Phủ Theo Cấp HSK 1–6, Kỹ Năng & Dạng Bài</span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Ngưỡng cấu hình: {coverageMatrix?.targets?.initialPartTypeTarget ?? 30} câu/dạng bài, {coverageMatrix?.targets?.initialSkillTarget ?? 200} câu/kỹ năng (mở rộng {coverageMatrix?.targets?.extendedSkillTarget ?? 500}), tối thiểu {coverageMatrix?.targets?.initialExamSetsTarget ?? 3} bộ đề chuẩn blueprint/cấp.
                  </p>
                </div>

                {/* Filters for Coverage Matrix */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Lọc cấp HSK"
                    data-testid="select-matrix-level"
                    value={matrixFilterLevel}
                    onChange={(e) => setMatrixFilterLevel(e.target.value)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--color-background)] border border-[var(--color-border)]"
                  >
                    <option value="all">Tất cả HSK 1–6</option>
                    {[1, 2, 3, 4, 5, 6].map((lvl) => (
                      <option key={lvl} value={String(lvl)}>HSK {lvl}</option>
                    ))}
                  </select>

                  <select
                    aria-label="Lọc kỹ năng"
                    data-testid="select-matrix-skill"
                    value={matrixFilterSkill}
                    onChange={(e) => setMatrixFilterSkill(e.target.value)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--color-background)] border border-[var(--color-border)]"
                  >
                    <option value="all">Tất cả kỹ năng</option>
                    <option value="listening">Nghe (Listening)</option>
                    <option value="reading">Đọc (Reading)</option>
                    <option value="writing">Viết (Writing)</option>
                  </select>

                  <input
                    type="text"
                    data-testid="input-matrix-part-type"
                    value={matrixFilterPartType === 'all' ? '' : matrixFilterPartType}
                    onChange={(e) => setMatrixFilterPartType(e.target.value.trim() || 'all')}
                    placeholder="Lọc dạng bài (part_type)..."
                    className="px-3 py-1.5 rounded-xl text-xs bg-[var(--color-background)] border border-[var(--color-border)]"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[var(--color-background)] text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
                      <th className="py-2.5 px-3 font-bold">Cấp</th>
                      <th className="py-2.5 px-3 font-bold">Kỹ năng</th>
                      <th className="py-2.5 px-3 font-bold">Dạng bài (Blueprint Part)</th>
                      <th className="py-2.5 px-3 font-bold text-right">Mục tiêu</th>
                      <th className="py-2.5 px-3 font-bold text-right">Đã duyệt</th>
                      <th className="py-2.5 px-3 font-bold text-right">Chờ duyệt</th>
                      <th className="py-2.5 px-3 font-bold text-right">Còn thiếu</th>
                      <th className="py-2.5 px-3 font-bold text-right">Từ vựng riêng</th>
                      <th className="py-2.5 px-3 font-bold">Trạng thái</th>
                      <th className="py-2.5 px-3 font-bold" data-testid="th-last-task-status">Trạng thái tác vụ gần nhất</th>
                      <th className="py-2.5 px-3 font-bold">Chi tiết / Nguyên nhân thiếu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {(coverageMatrix?.rows || [])
                      .filter((r: any) => matrixFilterLevel === 'all' || String(r.level) === matrixFilterLevel)
                      .filter((r: any) => matrixFilterSkill === 'all' || r.skill === matrixFilterSkill)
                      .filter((r: any) => matrixFilterPartType === 'all' || String(r.part_type).toLowerCase().includes(matrixFilterPartType.toLowerCase()))
                      .map((row: any, idx: number) => (
                        <tr key={`${row.level}_${row.skill}_${row.part_type}_${idx}`} className="hover:bg-[var(--color-background)]/60">
                          <td className="py-2 px-3 font-bold text-[var(--color-primary)]">HSK {row.level}</td>
                          <td className="py-2 px-3 capitalize">{row.skill}</td>
                          <td className="py-2 px-3">
                            <div className="font-mono font-semibold text-[var(--color-text-primary)]">{row.part_type}</div>
                            {row.part_name && <div className="text-[10px] text-[var(--color-text-secondary)]">{row.part_name}</div>}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">{row.targetQuantity}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">{row.approvedCount}</td>
                          <td className="py-2 px-3 text-right font-mono text-amber-600">{row.pendingCount}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">{row.deficit}</td>
                          <td className="py-2 px-3 text-right font-mono">{row.uniqueTestedVocabCount} từ</td>
                          <td className="py-2 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.status === 'exam_ready' || row.status === 'extended_target_met' || row.status === 'minimum_coverage_met'
                                ? 'bg-emerald-500/15 text-emerald-600'
                                : row.status === 'blocked'
                                ? 'bg-rose-500/15 text-rose-600'
                                : 'bg-amber-500/15 text-amber-600'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span
                              data-testid={`last-task-status-${row.level}-${row.skill}-${row.part_type}`}
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.lastTaskStatus === 'completed'
                                  ? 'bg-emerald-500/15 text-emerald-600'
                                  : row.lastTaskStatus === 'failed'
                                  ? 'bg-rose-500/15 text-rose-600'
                                  : row.lastTaskStatus === 'partial'
                                  ? 'bg-amber-500/15 text-amber-600'
                                  : 'bg-gray-500/15 text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {row.lastTaskStatus === 'completed'
                                ? 'Hoàn thành (completed)'
                                : row.lastTaskStatus === 'failed'
                                ? 'Thất bại (failed)'
                                : row.lastTaskStatus === 'partial'
                                ? 'Một phần (partial)'
                                : 'Chưa chạy (none)'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[11px] text-[var(--color-text-secondary)]">
                            {row.blockReason || row.details}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* GRAMMAR CATALOG STATUS CARD */}
            <div
              data-testid="coverage-view-grammar-status"
              className="p-5 rounded-3xl bg-blue-500/5 border border-blue-500/20 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">
                    Chuẩn CLEC 2021: 572 điểm ngữ pháp (Trạng thái: Chưa số hóa / unverified · Độ bao phủ: 0.0%)
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 uppercase tracking-wider">
                  Standard: {coverageOverview?.grammarCoverage?.standard ?? 'CLEC 2021'} · Denominator: {coverageOverview?.grammarCoverage?.totalPoints ?? 572}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold">Tổng số điểm chuẩn hóa</span>
                  <p className="text-lg font-black text-[var(--color-text-primary)] mt-0.5">572 điểm ngữ pháp</p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">HSK 1: 48 · HSK 2: 81 · HSK 3: 141 · HSK 4: 144 · HSK 5: 98 · HSK 6: 60</p>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold">Điểm ngữ pháp đã kiểm tra</span>
                  <p className="text-lg font-black text-amber-600 mt-0.5" data-testid="grammar-tested-points">
                    {coverageOverview?.grammarCoverage?.testedPoints ?? 0} / 572 (0.0%)
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Chỉ tính câu hỏi có nhãn ngữ pháp đã xác minh nguồn</p>
                </div>
                <div className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold">Trạng thái số hóa danh mục</span>
                  <p className="text-lg font-black text-rose-500 mt-0.5" data-testid="grammar-catalog-status">
                    Chưa số hóa (unverified)
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Không tự ý gán 100% hoặc bịa đặt số liệu khi thiếu tệp chuẩn</p>
                </div>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] italic">
                * Nguyên tắc toàn vẹn hệ thống: Danh mục ngữ pháp CLEC 2021 chưa được số hóa đầy đủ trong thư mục <code>data/</code>. Hệ thống báo cáo trung thực 0.0% và từ chối mọi nhãn ngữ pháp giả định từ LLM cho tới khi danh mục chuẩn được nhập chính thức.
              </p>
            </div>

            {/* 3. ĐỘ BAO PHỦ TỪ VỰNG HSK 1-6 (4-TIER VOCABULARY COVERAGE) */}
            <div
              data-testid="coverage-view-vocab"
              className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>3. Độ Bao Phủ Từ Vựng & Chữ Hán Chuẩn HSK 3.0 (HSK 1–6 · 4 Mức Độ)</span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Tổng số mục từ HSK 1–6 đã xác minh từ <code>vocab.jsonl</code>: <strong>{coverageVocab?.totalWords ?? 5334}</strong> từ độc lập (đối chiếu chuẩn tham chiếu 5.400 từ tích lũy & 1.940 chữ Hán nhận biết).
                  </p>
                </div>
                <select
                  aria-label="Lọc từ vựng theo cấp HSK"
                  data-testid="select-vocab-level"
                  value={vocabFilterLevel}
                  onChange={(e) => setVocabFilterLevel(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--color-background)] border border-[var(--color-border)]"
                >
                  <option value="all">Tất cả HSK 1–6</option>
                  {[1, 2, 3, 4, 5, 6].map((lvl) => (
                    <option key={lvl} value={String(lvl)}>HSK {lvl}</option>
                  ))}
                </select>
              </div>

              {/* 4-Tier Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-gray-500/5 border border-gray-500/20">
                  <p className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase">Mức 0 · Chưa xuất hiện</p>
                  <p className="text-xl font-black text-[var(--color-text-primary)] mt-1" data-testid="vocab-tier0-count">
                    {coverageVocab?.overall?.tier0 ?? 0} từ
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Chưa có câu đã duyệt liên kết (Ưu tiên 60%)</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                  <p className="text-[11px] font-bold text-blue-600 uppercase">Mức 1 · Xuất hiện ngữ cảnh</p>
                  <p className="text-xl font-black text-blue-600 mt-1" data-testid="vocab-tier1-count">
                    {coverageVocab?.overall?.tier1 ?? 0} từ
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Mới nằm trong đề bài/đáp án nhiễu</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-[11px] font-bold text-emerald-600 uppercase">Mức 2 · Đã kiểm tra trực tiếp</p>
                  <p className="text-xl font-black text-emerald-600 mt-1" data-testid="vocab-tier2-count">
                    {coverageVocab?.overall?.tier2 ?? 0} từ
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Có ít nhất 1 câu kiểm tra trực tiếp (Cần mở rộng 25%)</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                  <p className="text-[11px] font-bold text-purple-600 uppercase">Mức 3 · Đã củng cố đa ngữ cảnh</p>
                  <p className="text-xl font-black text-purple-600 mt-1" data-testid="vocab-tier3-count">
                    {coverageVocab?.overall?.tier3 ?? 0} từ
                  </p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Có ≥ 2 câu đa dạng ngữ cảnh / dạng bài</p>
                </div>
              </div>

              {/* Distribution by Level (New vs Cumulative & 4 Tiers) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                {[1, 2, 3, 4, 5, 6].map((lvl) => {
                  const lData = coverageVocab?.byLevel?.[lvl] || { totalWords: 0, tier0: 0, tier1: 0, tier2: 0, tier3: 0, percentCoveredTier2Plus: 0 };
                  const bench = coverageOverview?.syllabusBenchmarks?.[lvl];
                  return (
                    <div key={lvl} className="p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-[var(--color-primary)]">HSK {lvl}</span>
                        <span>{lData.percentCoveredTier2Plus}% (Mức 2+3)</span>
                      </div>
                      <div className="text-[10px] text-[var(--color-text-secondary)]">
                        Từ mới: <strong>{lData.totalWords}</strong> (Chuẩn: {bench?.vocab?.referenceNew ?? '-'} · Tích lũy: {bench?.vocab?.verifiedCumulative ?? '-'})
                      </div>
                      <div className="text-[10px] text-[var(--color-text-secondary)]">
                        Chữ Hán: <strong>{bench?.chars?.verifiedRecognitionNew ?? '-'}</strong> mới / {bench?.chars?.verifiedRecognitionCumulative ?? '-'} nhận biết · Viết: {bench?.chars?.referenceWritingCumulative ?? '-'}
                      </div>
                      <div className="grid grid-cols-4 gap-1 pt-1 text-[10px] font-mono text-center">
                        <span className="p-1 rounded bg-gray-500/10" title="Mức 0">M0:{lData.tier0}</span>
                        <span className="p-1 rounded bg-blue-500/10 text-blue-600" title="Mức 1">M1:{lData.tier1}</span>
                        <span className="p-1 rounded bg-emerald-500/10 text-emerald-600" title="Mức 2">M2:{lData.tier2}</span>
                        <span className="p-1 rounded bg-purple-500/10 text-purple-600" title="Mức 3">M3:{lData.tier3}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Priority Missing Words Queue */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-[var(--color-text-primary)]">
                  Danh sách từ vựng ưu tiên cần sinh câu hỏi tiếp theo (Bộ lập kế hoạch 60% Mức 0/1 · 25% Mức 2 · 15% Ôn tập):
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-3 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]">
                  {(coverageVocab?.priorityMissingWords || [])
                    .filter((w: any) => vocabFilterLevel === 'all' || String(w.level) === vocabFilterLevel)
                    .slice(0, 48)
                    .map((w: any, i: number) => (
                      <span
                        key={`${w.word}_${i}`}
                        className="px-2.5 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-chinese flex items-center gap-1.5"
                      >
                        <strong className="text-[var(--color-text-primary)]">{w.word}</strong>
                        <span className="text-[10px] text-[var(--color-text-secondary)]">({w.pinyin})</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 font-bold">HSK{w.level}</span>
                      </span>
                    ))}
                </div>
              </div>
            </div>

            {/* 4. LỊCH SỬ CRON VÀ TÁC VỤ (CRON & TASK HISTORY) */}
            <div
              data-testid="coverage-view-cron-history"
              className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>4. Lịch Sử Cron Tự Động & Nhật Ký Tác Vụ Sinh Đề (Free-Tier Only)</span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Lịch định kỳ: <code>02:00 hằng ngày (0 2 * * *)</code> · Chu kỳ lặp: mỗi {cronHistory?.scheduler?.intervalHours ?? schedulerStatus?.intervalHours ?? 2}h · Đã sinh hôm nay: <strong>{cronHistory?.scheduler?.generatedToday ?? schedulerStatus?.generatedToday ?? 0}/{cronHistory?.scheduler?.maxQuestionsPerDay ?? schedulerStatus?.maxQuestionsPerDay ?? 20}</strong> câu.
                  </p>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  Lần chạy gần nhất: <strong>{cronHistory?.scheduler?.lastRunTime ? parseUtcDate(cronHistory.scheduler.lastRunTime).toLocaleString('vi-VN') : 'Chưa chạy trong phiên này'}</strong>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[var(--color-background)] text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
                      <th className="py-2.5 px-3 font-bold">Thời gian / Batch ID</th>
                      <th className="py-2.5 px-3 font-bold">Nhóm xử lý</th>
                      <th className="py-2.5 px-3 font-bold text-right">Yêu cầu</th>
                      <th className="py-2.5 px-3 font-bold text-right">Hợp lệ / Đã lưu</th>
                      <th className="py-2.5 px-3 font-bold text-right">Thiếu còn lại</th>
                      <th className="py-2.5 px-3 font-bold">Provider / Model</th>
                      <th className="py-2.5 px-3 font-bold">Trạng thái</th>
                      <th className="py-2.5 px-3 font-bold">Chi tiết / Lỗi phát sinh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {(cronHistory?.runs || []).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-[var(--color-text-secondary)]">
                          Chưa có bản ghi lịch sử chạy tác vụ nào.
                        </td>
                      </tr>
                    ) : (
                      (cronHistory?.runs || []).map((run: any, idx: number) => {
                        const det = run.parsed_details || {};
                        const remaining = det.remainingDeficit ?? Math.max(0, Number(run.count_requested || 0) - Number(run.count_saved_pending || 0));
                        return (
                          <tr key={run.id || idx} className="hover:bg-[var(--color-background)]/60">
                            <td className="py-2 px-3">
                              <div className="font-mono font-semibold text-[var(--color-text-primary)]">{run.batch_id || run.id}</div>
                              <div className="text-[10px] text-[var(--color-text-secondary)]">{parseUtcDate(run.created_at).toLocaleString('vi-VN')}</div>
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-bold text-[var(--color-primary)]">HSK {run.level}</span> · {run.skill || 'reading'}
                              {det.part_type && <div className="font-mono text-[10px] text-[var(--color-text-secondary)]">{det.part_type}</div>}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">{run.count_requested}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">{run.count_saved_pending}</td>
                            <td className="py-2 px-3 text-right font-mono text-amber-600">{remaining}</td>
                            <td className="py-2 px-3 font-mono text-[11px]">
                              {run.provider_used}
                              {run.model_name && run.model_name !== 'none' ? ` (${run.model_name})` : ''}
                            </td>
                            <td className="py-2 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                run.status === 'success'
                                  ? 'bg-emerald-500/15 text-emerald-600'
                                  : run.status === 'partial'
                                  ? 'bg-amber-500/15 text-amber-600'
                                  : 'bg-rose-500/15 text-rose-600'
                              }`}>
                                {run.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-[11px] text-[var(--color-text-secondary)]">
                              {det.error ? `${det.category || 'error'}: ${det.error}` : `Đã sinh ${run.count_generated} câu, loại ${run.count_rejected_validator} câu lỗi`}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* MODAL 1: EDIT QUESTION DIALOG */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="text-base sm:text-lg font-bold font-serif text-[var(--color-text-primary)]">
                  Chỉnh Sửa Câu Hỏi [{editingQuestion.question_id}]
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="p-1.5 rounded-xl hover:bg-[var(--color-background)] text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Level selection */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                  Cấp độ HSK
                </label>
                <select
                  value={editLevel}
                  onChange={(e) => setEditLevel(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-semibold focus:outline-hidden focus:border-[var(--color-primary)]"
                >
                  {[1, 2, 3, 4, 5, 6].map((l) => (
                    <option key={l} value={l}>
                      HSK {l}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stem input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                  Câu dẫn chữ Hán (Dùng ____ cho vị trí chỗ trống điền từ)
                </label>
                <textarea
                  rows={3}
                  value={editStem}
                  onChange={(e) => setEditStem(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm font-chinese focus:outline-hidden focus:border-[var(--color-primary)]"
                />
              </div>

              {/* 4 Options and correct answer radio */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                  4 Phương án lựa chọn (Chọn nút tròn để chỉ định Đáp án đúng)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {editOptions.map((opt, idx) => {
                    const label = ['A', 'B', 'C', 'D'][idx];
                    const isCorrect = editAnswerIndex === idx;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-[var(--color-border)] bg-[var(--color-background)]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="correct_answer"
                          id={`radio-opt-${idx}`}
                          checked={isCorrect}
                          onChange={() => setEditAnswerIndex(idx)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <label
                          htmlFor={`radio-opt-${idx}`}
                          className="font-bold text-xs shrink-0 cursor-pointer"
                        >
                          {label}.
                        </label>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const next = [...editOptions];
                            next[idx] = e.target.value;
                            setEditOptions(next);
                          }}
                          className="w-full px-2 py-1 rounded bg-transparent text-xs font-chinese focus:outline-hidden"
                          placeholder={`Phương án ${label}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vietnamese Explanation */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                  Lời giải thích chi tiết tiếng Việt
                </label>
                <textarea
                  rows={3}
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs focus:outline-hidden focus:border-[var(--color-primary)]"
                  placeholder="Giải thích ngữ pháp, từ loại, dịch nghĩa..."
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                disabled={isSavingEdit}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSavingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REVIEW OVERRIDE MODAL FOR FLAGGED QUESTIONS */}
      {overrideQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[var(--color-surface)] border border-amber-500/30 shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3 border-b border-[var(--color-border)] pb-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[var(--color-text-primary)] font-serif">
                  Phê Duyệt Ngoại Lệ Câu Hỏi Có Cờ QA
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 font-mono">
                  Mã câu hỏi: {overrideQuestion.question_id} • HSK {overrideQuestion.level}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOverrideQuestion(null);
                  setOverrideConfirmWord('');
                  setOverrideReason('');
                  setOverrideModalError(null);
                }}
                className="p-1 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Flags Detail */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <Info className="w-4 h-4 shrink-0" />
                Các cảnh báo kiểm định chất lượng cần bạn xác nhận:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
                {overrideQuestion.critical_flags?.flags?.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
                {overrideQuestion.qa?.notes?.map((n, i) => (
                  <li key={`n-${i}`}>Ghi chú: {n}</li>
                ))}
              </ul>
            </div>

            {/* Question Stem Mini-Preview */}
            <div className="p-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs space-y-1">
              <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Câu hỏi:</p>
              <p className="font-chinese font-bold text-sm text-[var(--color-text-primary)]">{overrideQuestion.stem}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                Đáp án: [{['A', 'B', 'C', 'D'][overrideQuestion.answer_index]}] {overrideQuestion.options[overrideQuestion.answer_index]}
              </p>
            </div>

            {overrideModalError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{overrideModalError}</span>
              </div>
            )}

            {/* Require exact word "duyet" */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center justify-between">
                <span>
                  Gõ từ xác nhận (Chính xác từ: <code className="text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1 py-0.5 rounded">duyet</code>):
                </span>
                {overrideConfirmWord.trim() === 'duyet' ? (
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <Check className="w-3.5 h-3.5" /> Đã khớp
                  </span>
                ) : (
                  <span className="text-[11px] text-rose-500">Chưa khớp</span>
                )}
              </label>
              <input
                type="text"
                value={overrideConfirmWord}
                onChange={(e) => setOverrideConfirmWord(e.target.value)}
                placeholder="duyet"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--color-background)] border border-[var(--color-border)] focus:outline-none focus:border-amber-500 font-mono text-[var(--color-text-primary)]"
              />
            </div>

            {/* Require reason >= 10 chars */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-primary)]">
                <label>Lý do phê duyệt ngoại lệ (Tối thiểu 10 ký tự):</label>
                <span className={`text-[11px] font-mono ${overrideReason.trim().length >= 10 ? 'text-emerald-600 font-bold' : 'text-amber-600'}`}>
                  {overrideReason.trim().length}/10 ký tự
                </span>
              </div>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Ví dụ: Đã kiểm tra ngữ cảnh câu dẫn rõ nghĩa, đáp án duy nhất đúng theo bài học..."
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--color-background)] border border-[var(--color-border)] focus:outline-none focus:border-amber-500 text-[var(--color-text-primary)] leading-relaxed resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => {
                  setOverrideQuestion(null);
                  setOverrideConfirmWord('');
                  setOverrideReason('');
                  setOverrideModalError(null);
                }}
                disabled={isSubmittingOverride}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReviewSubmit}
                disabled={overrideConfirmWord.trim() !== 'duyet' || overrideReason.trim().length < 10 || isSubmittingOverride}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isSubmittingOverride ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang duyệt...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Xác nhận Duyệt Ngoại lệ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TWO-PHASE SYNC WORKFLOW DIALOG */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)] font-serif">
                    Đồng Bộ Ngân Hàng Đề Thi Web
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Quy trình kiểm soát an toàn 2 bước: Thẩm định Dry-Run & Nạp chính thức
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                disabled={syncPhase === 'dry_running' || syncPhase === 'executing'}
                className="p-1 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {syncError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{syncError}</span>
              </div>
            )}

            {/* STAGE 1: DRY RUNNING SPINNER */}
            {syncPhase === 'dry_running' && (
              <div className="py-10 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[var(--color-primary)] animate-spin mx-auto" />
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Đang tiến hành kiểm định thử nghiệm (Dry-Run)...
                </p>
                <p className="text-[11px] text-[var(--color-text-secondary)] max-w-xs mx-auto">
                  Đối soát trùng lặp SHA-256, 4-gram ký tự và lọc các cờ cảnh báo trước khi nạp.
                </p>
              </div>
            )}

            {/* STAGE 2: DRY RUN SUMMARY & RETYPE CONFIRMATION */}
            {syncPhase === 'summary' && dryRunData && (
              <div className="space-y-4">
                {/* 4 Summary Cards */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                    <span className="text-[10px] font-bold uppercase block text-emerald-700 dark:text-emerald-400">
                      Sẵn sàng nạp
                    </span>
                    <span className="text-xl font-black mt-0.5 block">
                      {dryRunData.count_synced ?? dryRunData.synced_count ?? 0} câu
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-500/10 border border-slate-500/20 text-[var(--color-text-primary)]">
                    <span className="text-[10px] font-bold uppercase block text-[var(--color-text-secondary)]">
                      Trùng lặp bỏ qua
                    </span>
                    <span className="text-xl font-black mt-0.5 block">
                      {(dryRunData.skipped_duplicate_hash || 0) + (dryRunData.skipped_near_duplicate || 0)} câu
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300">
                    <span className="text-[10px] font-bold uppercase block text-rose-700 dark:text-rose-400">
                      Bị chặn an toàn
                    </span>
                    <span className="text-xl font-black mt-0.5 block">
                      {dryRunData.skipped_blocked_flags || (dryRunData.blocked_questions?.length ?? 0)} câu
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                    <span className="text-[10px] font-bold uppercase block text-amber-700 dark:text-amber-400">
                      Tổng câu đã duyệt
                    </span>
                    <span className="text-xl font-black mt-0.5 block">
                      {dryRunData.total_eligible ?? 0} câu
                    </span>
                  </div>
                </div>

                {/* SQLite Backup Path Info */}
                <div className="p-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs space-y-1">
                  <p className="text-[10px] font-bold uppercase text-[var(--color-text-secondary)] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Bản sao lưu SQLite tự động:
                  </p>
                  <p className="font-mono text-[11px] text-[var(--color-text-primary)] break-all select-all">
                    {dryRunData.backup_file || dryRunData.backup_path || 'data/hsk_exam.db.backup_* (sẽ tự động tạo khi ghi)'}
                  </p>
                </div>

                {/* Blocked Questions List with Reasons */}
                {dryRunData.blocked_questions && dryRunData.blocked_questions.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Danh sách {dryRunData.blocked_questions.length} câu bị chặn (Cần xử lý trước):
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs">
                      {dryRunData.blocked_questions.map((b, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] leading-relaxed">
                          <span className="font-mono font-bold text-rose-600 shrink-0">{b.question_id}:</span>
                          <span className="text-rose-700 dark:text-rose-300">{b.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Retype question count input to unlock */}
                {(dryRunData.count_synced ?? dryRunData.synced_count ?? 0) > 0 ? (
                  <div className="p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-2">
                    <label className="text-xs font-semibold text-[var(--color-text-primary)] block">
                      Xác nhận an toàn: Nhập lại chính xác số lượng câu hỏi sẽ nạp (
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {dryRunData.count_synced ?? dryRunData.synced_count}
                      </strong>
                      ) để mở khóa nút nạp đề:
                    </label>
                    <input
                      type="text"
                      value={retypeCountInput}
                      onChange={(e) => setRetypeCountInput(e.target.value.trim())}
                      placeholder={String(dryRunData.count_synced ?? dryRunData.synced_count)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-center text-base font-mono font-black bg-[var(--color-surface)] border border-[var(--color-border)] focus:outline-none focus:border-emerald-500 text-[var(--color-text-primary)]"
                    />
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs text-center font-semibold">
                    Không có câu hỏi mới nào đủ điều kiện hợp lệ để nạp vào cơ sở dữ liệu web.
                  </div>
                )}

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setShowSyncModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteSync}
                    disabled={
                      (dryRunData.count_synced ?? dryRunData.synced_count ?? 0) === 0 ||
                      retypeCountInput.trim() !== String(dryRunData.count_synced ?? dryRunData.synced_count)
                    }
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Xác nhận nạp đề</span>
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 3: EXECUTING SPINNER */}
            {syncPhase === 'executing' && (
              <div className="py-10 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Đang thực thi đồng bộ dữ liệu vào cơ sở dữ liệu web...
                </p>
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  Tạo bản sao lưu và cam kết giao dịch (Atomic Transaction). Vui lòng không đóng tab.
                </p>
              </div>
            )}

            {/* STAGE 4: SUCCESS SUMMARY */}
            {syncPhase === 'success' && syncResult && (
              <div className="py-4 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto text-xl">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-[var(--color-text-primary)]">
                    Đồng Bộ Thành Công!
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Đã nạp thành công{' '}
                    <strong className="text-emerald-600">{syncResult.synced_count} câu hỏi</strong>{' '}
                    vào bảng <code>questions</code> của phòng thi thử.
                  </p>
                </div>
                {syncResult.backup_file && (
                  <div className="p-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[11px] font-mono text-[var(--color-text-secondary)] break-all text-left">
                    <span className="font-bold block text-[var(--color-text-primary)]">File sao lưu:</span>
                    {syncResult.backup_file}
                  </div>
                )}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSyncModal(false)}
                    className="px-6 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold cursor-pointer"
                  >
                    Hoàn tất & Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: TOKEN AUTH PROMPT MODAL */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 shrink-0">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)] font-serif">
                    Xác Thực QBANK_ADMIN_TOKEN
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Mã khóa quản trị bảo vệ backend QBank
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTokenModal(false)}
                className="p-1 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {tokenModalError && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{tokenModalError}</span>
              </div>
            )}

            <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed space-y-1.5">
              <p>
                Vui lòng nhập mã <strong>QBANK_ADMIN_TOKEN</strong> được cấu hình trong file <code>.env</code> của máy chủ backend.
              </p>
              <p className="text-[11px] italic">
                Mã token được lưu an toàn trong <code>sessionStorage</code> và sẽ tự động xóa khi đóng tab trình duyệt.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)] block">
                Mã Token Quản trị:
              </label>
              <div className="relative">
                <input
                  type={showTokenPassword ? 'text' : 'password'}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Nhập hoặc dán token tại đây..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-xs font-mono bg-[var(--color-background)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowTokenPassword(!showTokenPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                >
                  {showTokenPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setShowTokenModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveTokenAndRetry}
                disabled={!tokenInput.trim()}
                className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-40 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Lưu Token & Tiếp Tục</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* FLOATING / STICKY BULK TOOLBAR */}
      {selectedPendingIds.size > 0 && activeSubTab === 'duyet_de' && (
        <div
          data-testid="floating-bulk-toolbar"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl rounded-3xl px-5 py-3.5 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-4"
        >
          <div
            data-testid="text-bulk-selected-count"
            className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)] pr-2 border-r border-[var(--color-border)]"
          >
            <ListChecks className="w-4 h-4 text-[var(--color-primary)]" />
            <span>
              Đã chọn <strong>{selectedPendingIds.size}</strong> câu
            </span>
          </div>

          <button
            type="button"
            data-testid="btn-bulk-approve"
            onClick={() => handleApprovePending(Array.from(selectedPendingIds))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Duyệt tất cả đã chọn ({selectedPendingIds.size} câu)</span>
          </button>

          <button
            type="button"
            data-testid="btn-bulk-reject"
            onClick={() => {
              setRejectingPendingIds(Array.from(selectedPendingIds));
              setRejectReasonNote('');
              setIsRejectModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/30 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Từ chối & xóa đã chọn</span>
          </button>

          <button
            type="button"
            data-testid="btn-bulk-disable"
            onClick={() => handleDisablePending(Array.from(selectedPendingIds))}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-500/10 hover:bg-gray-500/20 text-gray-700 dark:text-gray-300 border border-gray-500/30 transition-all cursor-pointer"
          >
            <Pause className="w-4 h-4" />
            <span>Vô hiệu hóa đã chọn</span>
          </button>

          <button
            type="button"
            data-testid="btn-bulk-export"
            onClick={() => {
              setExportModalTitle(`Xuất ${selectedPendingIds.size} câu hỏi đã chọn`);
              setExportModalCount(selectedPendingIds.size);
              setExportModalQuestionIds(Array.from(selectedPendingIds));
              setExportModalQuestions(filteredPendingQuestions.filter((q) => selectedPendingIds.has(q.id)));
              setExportModalFilterParams(undefined);
              setExportModalDefaultTitle(`HSK_Bulk_Export_${new Date().toISOString().slice(0, 10)}`);
              setExportModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border border-blue-500/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất đã chọn ({selectedPendingIds.size})</span>
          </button>

          <button
            type="button"
            data-testid="btn-bulk-deselect"
            onClick={() => setSelectedPendingIds(new Set())}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      {/* MODAL: REJECT REASON DIALOG */}
      {isRejectModalOpen && (
        <div
          data-testid="modal-reject-pending"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" />
                <h3
                  data-testid="modal-reject-title"
                  className="text-base font-bold font-serif text-[var(--color-text-primary)]"
                >
                  {rejectingPendingIds.length > 1
                    ? `Từ chối & Xóa ${rejectingPendingIds.length} câu hỏi đã chọn`
                    : `Từ chối & Xóa câu hỏi [${rejectingPendingIds[0]}]`}
                </h3>
              </div>
              <button
                type="button"
                data-testid="btn-close-reject-modal"
                onClick={() => setIsRejectModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[var(--color-background)] text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                Lý do từ chối (tùy chọn):
              </label>
              <textarea
                rows={3}
                data-testid="textarea-rejection-note"
                value={rejectReasonNote}
                onChange={(e) => setRejectReasonNote(e.target.value)}
                placeholder="Ví dụ: Ngữ cảnh câu dẫn mơ hồ, từ vựng vượt cấp, phương án sai chưa rõ ràng..."
                className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs focus:outline-hidden focus:border-[var(--color-primary)]"
              />
              <p className="text-[10px] text-[var(--color-text-secondary)]">
                Ghi chú này sẽ được lưu vào hệ thống để phục vụ đối soát và cải thiện chất lượng sinh câu hỏi.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                data-testid="btn-cancel-reject"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={isSubmittingReject}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-background)] border border-[var(--color-border)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                data-testid="btn-confirm-reject"
                onClick={() => handleRejectPending(rejectingPendingIds, rejectReasonNote.trim() || undefined)}
                disabled={isSubmittingReject}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmittingReject ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Xác nhận từ chối & xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MULTI-FORMAT EXAM EXPORT */}
      <ExportExamModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title={exportModalTitle}
        count={exportModalCount}
        questionIds={exportModalQuestionIds}
        questions={exportModalQuestions}
        filterParams={exportModalFilterParams}
        defaultExamTitle={exportModalDefaultTitle}
        onTokenExpired={() => promptTokenModal()}
      />

      {/* MODAL: GOLDEN PROMPT LIBRARY (R3) */}
      <GoldenPromptLibraryModal
        isOpen={isGoldenPromptsOpen}
        onClose={() => setIsGoldenPromptsOpen(false)}
        initialLevel={importLevel}
        onApplyToEditor={(promptText) => {
          setImportMode('text');
          setImportInputText(promptText);
        }}
      />
    </div>
  );
};

export default QBankAdmin;
