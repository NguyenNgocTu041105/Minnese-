import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Sliders,
  Check,
  Eye,
  EyeOff,
  Clock,
  BookOpen,
  Award,
  Layers,
  FileText,
  Play,
  RotateCcw,
  Volume2,
  Trash2,
  Edit3,
  HelpCircle,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { formatThemeTag } from '../QBankAdmin';
import { saveOnlineExamToFirestore } from '../../lib/firebase';
import { OnlineExamDoc, QuizQuestion, HSKLevel } from '../../types';
import { ExportExamModal } from './ExportExamModal';

export interface ExamStudioProps {
  adminToken?: string;
  onNavigateToTab?: (tab: string) => void;
  onExamCreated?: (examData: any) => void;
}

export interface StudioQuestion {
  id: string;
  stem: string;
  options: string[];
  answer_idx: number;
  pinyin?: string | null;
  explanation_vi: string;
  level: number;
  skill: string;
  part_type: string;
  illustration_theme?: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  quality_score?: number;
  provider_used?: string;
}

export interface PartAllocation {
  skill: 'listening' | 'reading' | 'writing';
  part_type: string;
  part_name_vi: string;
  count: number;
  points_per_question: number;
}

export const DEFAULT_BLUEPRINTS: Record<number, {
  name: string;
  totalTimeMin: number;
  totalQuestions: number;
  maxScore: number;
  passScore: number;
  allocations: PartAllocation[];
}> = {
  1: {
    name: 'Đề Chuẩn HSK 1 (Sơ cấp 1)',
    totalTimeMin: 40,
    totalQuestions: 40,
    maxScore: 200,
    passScore: 120,
    allocations: [
      { skill: 'listening', part_type: 'listen_picture_match_3opt', part_name_vi: 'Nghe - Nhìn tranh chọn đáp án (3 lựa chọn)', count: 5, points_per_question: 5 },
      { skill: 'listening', part_type: 'listen_question_answer_3opt', part_name_vi: 'Nghe - Nghe hỏi chọn đáp án (3 lựa chọn)', count: 5, points_per_question: 5 },
      { skill: 'listening', part_type: 'listen_dialogue_picture_match_6opt', part_name_vi: 'Nghe - Đối thoại chọn tranh (6 lựa chọn)', count: 5, points_per_question: 5 },
      { skill: 'listening', part_type: 'listen_monologue_qa_3opt', part_name_vi: 'Nghe - Độc thoại/đoạn ngắn (3 lựa chọn)', count: 5, points_per_question: 5 },
      { skill: 'reading', part_type: 'read_sentence_picture_match_6opt', part_name_vi: 'Đọc - Khớp câu với tranh (6 lựa chọn)', count: 5, points_per_question: 5 },
      { skill: 'reading', part_type: 'read_dialogue_matching_6opt', part_name_vi: 'Đọc - Ghép câu hỏi đáp (6 lựa chọn)', count: 5, points_per_question: 5 },
      { skill: 'reading', part_type: 'read_fill_blank_word_bank_6opt', part_name_vi: 'Đọc - Điền từ vào chỗ trống (Ngân hàng 6 từ)', count: 5, points_per_question: 5 },
      { skill: 'reading', part_type: 'read_comprehension_short_3opt', part_name_vi: 'Đọc hiểu - Đoạn văn ngắn (3 lựa chọn)', count: 5, points_per_question: 5 },
    ],
  },
  2: {
    name: 'Đề Chuẩn HSK 2 (Sơ cấp 2)',
    totalTimeMin: 60,
    totalQuestions: 60,
    maxScore: 300,
    passScore: 180,
    allocations: [
      { skill: 'listening', part_type: 'listen_picture_match_3opt', part_name_vi: 'Nghe - Nhìn tranh chọn đáp án', count: 5, points_per_question: 4 },
      { skill: 'listening', part_type: 'listen_dialogue_picture_match_split', part_name_vi: 'Nghe - Đối thoại chọn tranh', count: 10, points_per_question: 4 },
      { skill: 'listening', part_type: 'listen_dialogue_qa_3opt', part_name_vi: 'Nghe - Hội thoại ngắn chọn đáp án', count: 10, points_per_question: 4 },
      { skill: 'reading', part_type: 'read_sentence_picture_match_6opt', part_name_vi: 'Đọc - Khớp câu với tranh', count: 5, points_per_question: 4 },
      { skill: 'reading', part_type: 'read_fill_blank_word_bank_6opt', part_name_vi: 'Đọc - Điền từ vào chỗ trống', count: 5, points_per_question: 4 },
      { skill: 'reading', part_type: 'read_dialogue_matching_split', part_name_vi: 'Đọc - Ghép nối hội thoại', count: 10, points_per_question: 4 },
      { skill: 'reading', part_type: 'read_comprehension_short_3opt', part_name_vi: 'Đọc hiểu - Đoạn văn ngắn', count: 5, points_per_question: 4 },
      { skill: 'writing', part_type: 'write_component_assembly_6opt', part_name_vi: 'Viết - Ghép bộ thủ thành chữ', count: 5, points_per_question: 10 },
      { skill: 'writing', part_type: 'write_tianzige_from_pinyin', part_name_vi: 'Viết - Nhìn pinyin viết chữ Hán', count: 5, points_per_question: 10 },
    ],
  },
  3: {
    name: 'Đề Chuẩn HSK 3 (Trung cấp 1)',
    totalTimeMin: 83,
    totalQuestions: 70,
    maxScore: 300,
    passScore: 180,
    allocations: [
      { skill: 'listening', part_type: 'listen_dialogue_picture_match_split', part_name_vi: 'Nghe - Hội thoại chọn tranh', count: 10, points_per_question: 3.33 },
      { skill: 'listening', part_type: 'listen_dialogue_qa_3opt', part_name_vi: 'Nghe - Đối thoại ngắn chọn đáp án', count: 10, points_per_question: 3.33 },
      { skill: 'listening', part_type: 'listen_monologue_qa_3opt', part_name_vi: 'Nghe - Độc thoại/đoạn văn ngắn', count: 10, points_per_question: 3.33 },
      { skill: 'reading', part_type: 'read_sentence_matching_split', part_name_vi: 'Đọc - Ghép câu tương ứng', count: 10, points_per_question: 3.33 },
      { skill: 'reading', part_type: 'read_fill_blank_word_bank_split', part_name_vi: 'Đọc - Điền từ vào chỗ trống', count: 10, points_per_question: 3.33 },
      { skill: 'reading', part_type: 'read_comprehension_short_and_medium_3opt', part_name_vi: 'Đọc hiểu - Đoạn văn ngắn & vừa', count: 10, points_per_question: 3.33 },
      { skill: 'writing', part_type: 'write_tianzige_from_pinyin', part_name_vi: 'Viết - Điền chữ Hán vào chỗ trống', count: 5, points_per_question: 10 },
      { skill: 'writing', part_type: 'write_sentence_from_picture_word', part_name_vi: 'Viết - Đặt câu theo tranh và từ', count: 5, points_per_question: 10 },
    ],
  },
  4: {
    name: 'Đề Chuẩn HSK 4 (Trung cấp 2)',
    totalTimeMin: 85,
    totalQuestions: 70,
    maxScore: 300,
    passScore: 180,
    allocations: [
      { skill: 'listening', part_type: 'listen_dialogue_qa_4opt', part_name_vi: 'Nghe - Hội thoại ngắn và đơn câu', count: 14, points_per_question: 3.125 },
      { skill: 'listening', part_type: 'listen_talks_qa_4opt', part_name_vi: 'Nghe - Hội thoại dài và đoạn văn', count: 18, points_per_question: 3.125 },
      { skill: 'reading', part_type: 'read_fill_blank_word_bank_split', part_name_vi: 'Đọc - Điền từ vào chỗ trống', count: 10, points_per_question: 3.125 },
      { skill: 'reading', part_type: 'read_comprehension_passages_4opt', part_name_vi: 'Đọc hiểu - Đoạn văn ngắn và vừa', count: 15, points_per_question: 3.125 },
      { skill: 'reading', part_type: 'read_cloze_passage_sentence_insertion', part_name_vi: 'Đọc hiểu - Điền câu vào đoạn văn', count: 7, points_per_question: 3.125 },
      { skill: 'writing', part_type: 'write_sentence_from_picture_word', part_name_vi: 'Viết - Đặt câu theo tranh và từ', count: 5, points_per_question: 10 },
      { skill: 'writing', part_type: 'write_short_essay_80chars', part_name_vi: 'Viết - Đoạn văn ngắn 80 chữ', count: 1, points_per_question: 50 },
    ],
  },
  5: {
    name: 'Đề Chuẩn HSK 5 (Cao cấp 1)',
    totalTimeMin: 110,
    totalQuestions: 72,
    maxScore: 300,
    passScore: 180,
    allocations: [
      { skill: 'listening', part_type: 'listen_dialogue_qa_4opt', part_name_vi: 'Nghe - Hội thoại ngắn chọn đáp án', count: 19, points_per_question: 2.857 },
      { skill: 'listening', part_type: 'listen_talks_qa_4opt', part_name_vi: 'Nghe - Hội thoại dài và bài nói', count: 16, points_per_question: 2.857 },
      { skill: 'reading', part_type: 'read_cloze_passages_4opt', part_name_vi: 'Đọc - Điền từ đoạn văn (Cloze)', count: 10, points_per_question: 2.857 },
      { skill: 'reading', part_type: 'read_paragraph_sentence_ordering', part_name_vi: 'Đọc - Sắp xếp trật tự câu thành đoạn', count: 10, points_per_question: 2.857 },
      { skill: 'reading', part_type: 'read_comprehension_long_articles_4opt', part_name_vi: 'Đọc hiểu - Bài đọc dài nhiều câu hỏi', count: 15, points_per_question: 2.857 },
      { skill: 'writing', part_type: 'write_story_from_4pictures_100chars', part_name_vi: 'Viết - Kể chuyện theo 4 tranh (100 chữ)', count: 1, points_per_question: 40 },
      { skill: 'writing', part_type: 'write_topic_essay_200chars', part_name_vi: 'Viết - Bài văn theo chủ đề (200 chữ)', count: 1, points_per_question: 60 },
    ],
  },
  6: {
    name: 'Đề Chuẩn HSK 6 (Cao cấp 2)',
    totalTimeMin: 125,
    totalQuestions: 82,
    maxScore: 300,
    passScore: 180,
    allocations: [
      { skill: 'listening', part_type: 'listen_dialogue_qa_4opt', part_name_vi: 'Nghe - Hội thoại chuyên sâu và phỏng vấn', count: 20, points_per_question: 2.5 },
      { skill: 'listening', part_type: 'listen_talks_qa_4opt', part_name_vi: 'Nghe - Bài giảng và phóng sự học thuật', count: 20, points_per_question: 2.5 },
      { skill: 'reading', part_type: 'read_find_faulty_sentence_4opt', part_name_vi: 'Đọc - Tìm câu có lỗi ngữ pháp/dùng từ', count: 10, points_per_question: 2.5 },
      { skill: 'reading', part_type: 'read_cloze_passages_4opt', part_name_vi: 'Đọc - Điền từ vào đoạn văn học thuật', count: 10, points_per_question: 2.5 },
      { skill: 'reading', part_type: 'read_comprehension_long_articles_4opt', part_name_vi: 'Đọc hiểu - Văn bản luận thuyết chuyên sâu', count: 20, points_per_question: 2.5 },
      { skill: 'writing', part_type: 'write_summary_shortening_400chars', part_name_vi: 'Viết - Tóm tắt bài văn 1000 chữ thành 400 chữ', count: 1, points_per_question: 60 },
      { skill: 'writing', part_type: 'write_topic_essay_300chars', part_name_vi: 'Viết - Bài luận nghị luận xã hội (300 chữ)', count: 1, points_per_question: 40 },
    ],
  },
};

export const AIExamStudio: React.FC<ExamStudioProps> = ({
  adminToken,
  onNavigateToTab,
  onExamCreated,
}) => {
  // Stepper State: 1..8
  const [currentStep, setCurrentStep] = useState<number>(1);
  const isRestoringRef = useRef(false);

  // Step 1: Basic Info
  const [examTitle, setExamTitle] = useState('Đề Thi Thử HSK 3.0 - Kỳ Chuẩn Hóa');
  const [level, setLevel] = useState<number>(3);
  const [examType, setExamType] = useState<'official_mock' | 'diagnostic' | 'unit_test' | 'skill_drill'>('official_mock');
  const [targetAudience, setTargetAudience] = useState('Lớp Luyện Thi HSK - Toàn Hệ Thống');

  // Step 2: Content & Skill Configuration
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['listening', 'reading', 'writing']);
  const [topic, setTopic] = useState('');
  const [difficultyRatio, setDifficultyRatio] = useState({ easy: 30, medium: 50, hard: 20 });
  const [requireVisuals, setRequireVisuals] = useState(false);

  // Step 3: Question Blueprint Breakdown
  const [allocations, setAllocations] = useState<PartAllocation[]>(DEFAULT_BLUEPRINTS[3].allocations);
  const [totalTimeMin, setTotalTimeMin] = useState<number>(DEFAULT_BLUEPRINTS[3].totalTimeMin);
  const [passScore, setPassScore] = useState<number>(DEFAULT_BLUEPRINTS[3].passScore);

  // When level changes, reload default blueprints
  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }
    const bp = DEFAULT_BLUEPRINTS[level] || DEFAULT_BLUEPRINTS[1];
    setAllocations(bp.allocations);
    setTotalTimeMin(bp.totalTimeMin);
    setPassScore(bp.passScore);
    if (level <= 1) {
      setSelectedSkills(['listening', 'reading']);
    } else {
      setSelectedSkills(['listening', 'reading', 'writing']);
    }
    loadPoolInspection();
  }, [level]);

  // Pool Inspection state for zero-API exam assembly
  const [poolInspection, setPoolInspection] = useState<any>(null);
  const [inspectionLoading, setInspectionLoading] = useState(false);

  const loadPoolInspection = async () => {
    setInspectionLoading(true);
    try {
      const token = adminToken || sessionStorage.getItem('qbank_admin_token') || '';
      const headers: Record<string, string> = {};
      if (token) {
        headers['X-QBank-Admin-Token'] = token;
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/qbank/exam/pool-inspection?level=${level}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPoolInspection(data.inspection);
        }
      }
    } catch {} finally {
      setInspectionLoading(false);
    }
  };

  // Step 4: Review Settings & Model Selection
  const [modelTier, setModelTier] = useState('waterfall_auto');
  const [useSolver, setUseSolver] = useState(true);

  // Step 5: Real LLM Question Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState({ current: 0, total: 10, message: '' });
  const [genError, setGenError] = useState<string | null>(null);

  // Step 6: Question Curation & Review
  const [generatedQuestions, setGeneratedQuestions] = useState<StudioQuestion[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<StudioQuestion>>({});

  // Step 7: Exam Assembly
  const [examCode, setExamCode] = useState('');
  const [createdExamDoc, setCreatedExamDoc] = useState<OnlineExamDoc | null>(null);
  const [isSavingExam, setIsSavingExam] = useState(false);
  const [assemblySuccess, setAssemblySuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Storage key & draft recovery state
  const STORAGE_KEY_STUDIO_DRAFT = 'minnese_ai_exam_studio_draft';
  const [draftNotice, setDraftNotice] = useState<{
    timestamp: string;
    questionCount: number;
    title: string;
    level: number;
    step: number;
  } | null>(null);

  // Check for saved draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STUDIO_DRAFT);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft && Array.isArray(draft.generatedQuestions) && draft.generatedQuestions.length > 0) {
          setDraftNotice({
            timestamp: draft.savedAt ? new Date(draft.savedAt).toLocaleString('vi-VN') : '',
            questionCount: draft.generatedQuestions.length,
            title: draft.examTitle || 'Đề thi nháp',
            level: draft.level || 3,
            step: draft.currentStep || 6,
          });
        }
      }
    } catch (e) {
      console.warn('[AIExamStudio] Failed to read draft from localStorage:', e);
    }
  }, []);

  // Restore draft handler
  const handleRestoreDraft = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STUDIO_DRAFT);
      if (!raw) return;
      const draft = JSON.parse(raw);
      isRestoringRef.current = true;
      if (Array.isArray(draft.generatedQuestions)) setGeneratedQuestions(draft.generatedQuestions);
      if (typeof draft.currentStep === 'number') setCurrentStep(draft.currentStep);
      if (draft.examTitle) setExamTitle(draft.examTitle);
      if (typeof draft.level === 'number') setLevel(draft.level);
      if (draft.examType) setExamType(draft.examType);
      if (draft.targetAudience) setTargetAudience(draft.targetAudience);
      if (Array.isArray(draft.selectedSkills)) setSelectedSkills(draft.selectedSkills);
      if (draft.topic !== undefined) setTopic(draft.topic);
      if (draft.difficultyRatio) setDifficultyRatio(draft.difficultyRatio);
      if (typeof draft.requireVisuals === 'boolean') setRequireVisuals(draft.requireVisuals);
      if (Array.isArray(draft.allocations)) setAllocations(draft.allocations);
      if (typeof draft.totalTimeMin === 'number') setTotalTimeMin(draft.totalTimeMin);
      if (typeof draft.passScore === 'number') setPassScore(draft.passScore);
      if (draft.modelTier) setModelTier(draft.modelTier);
      if (typeof draft.useSolver === 'boolean') setUseSolver(draft.useSolver);
      if (draft.examCode) setExamCode(draft.examCode);
      setDraftNotice(null);
    } catch (e) {
      console.error('[AIExamStudio] Failed to restore draft:', e);
    }
  };

  // Discard draft handler
  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_STUDIO_DRAFT);
    } catch (e) {}
    setDraftNotice(null);
  };

  // Auto-save draft to localStorage whenever generatedQuestions or step changes
  useEffect(() => {
    if (generatedQuestions && generatedQuestions.length > 0) {
      try {
        const draft = {
          currentStep,
          examTitle,
          level,
          examType,
          targetAudience,
          selectedSkills,
          topic,
          difficultyRatio,
          requireVisuals,
          allocations,
          totalTimeMin,
          passScore,
          modelTier,
          useSolver,
          generatedQuestions,
          examCode,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY_STUDIO_DRAFT, JSON.stringify(draft));
      } catch (err) {
        console.warn('[AIExamStudio] Failed to auto-save draft to localStorage:', err);
      }
    }
  }, [
    generatedQuestions,
    currentStep,
    examTitle,
    level,
    examType,
    targetAudience,
    selectedSkills,
    topic,
    difficultyRatio,
    requireVisuals,
    allocations,
    totalTimeMin,
    passScore,
    modelTier,
    useSolver,
    examCode,
  ]);

  // Step 8: Dual-Mode Exam Preview
  const [previewMode, setPreviewMode] = useState<'student' | 'teacher'>('student');
  const [studentAnswers, setStudentAnswers] = useState<Record<number, number>>({});
  const [previewActiveIndex, setPreviewActiveIndex] = useState(0);
  const [isPreviewSubmitted, setIsPreviewSubmitted] = useState(false);
  const [previewScore, setPreviewScore] = useState<{ correct: number; total: number; score: number; passed: boolean } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Calculate total questions requested from blueprint
  const totalQuestionsNeeded = useMemo(() => {
    return allocations.reduce((acc, curr) => acc + curr.count, 0);
  }, [allocations]);

  // Step 5: Assemble from approved pool (0 LLM call)
  const handleAssembleFromPool = async () => {
    setIsGenerating(true);
    setGenError(null);
    setGenProgress({ current: 1, total: 2, message: 'Đang kiểm tra và ráp câu hỏi từ kho đã duyệt (0 API Call)...' });

    try {
      const token = adminToken || sessionStorage.getItem('qbank_admin_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['X-QBank-Admin-Token'] = token;
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/qbank/exam/assemble-or-supplement', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          level,
          mode: 'assemble',
          exam_title: examTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Kho câu hỏi chưa đủ điều kiện ghép đề.');
      }

      const questionsList: StudioQuestion[] = (data.questions || []).map((q: any) => ({
        id: q.id,
        stem: q.stem,
        options: Array.isArray(q.options) ? q.options : [],
        answer_idx: Number(q.answer_idx) || 0,
        pinyin: q.pinyin || null,
        explanation_vi: q.explanation_vi || '',
        level: Number(q.level) || level,
        skill: q.skill || 'reading',
        part_type: q.part_type || 'read_fill_blank_4opt',
        status: 'accepted',
        quality_score: 100,
        provider_used: 'Kho dữ liệu QBank (0 API Call)',
      }));

      setGeneratedQuestions(questionsList);
      setGenProgress({ current: 2, total: 2, message: `Thành công! Đã nạp ${questionsList.length} câu đạt chuẩn (0 API Call).` });

      setTimeout(() => {
        setIsGenerating(false);
        setCurrentStep(6);
      }, 600);
    } catch (err: any) {
      setIsGenerating(false);
      setGenError(err.message || 'Lỗi khi ghép đề từ kho');
    }
  };

  // Step 5: Bounded targeted supplement generation
  const handleSupplementGeneration = async () => {
    setIsGenerating(true);
    setGenError(null);
    setGenProgress({ current: 1, total: 2, message: 'Đang gửi yêu cầu sinh bù có giới hạn vào hàng đợi duyệt...' });

    try {
      const token = adminToken || sessionStorage.getItem('qbank_admin_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['X-QBank-Admin-Token'] = token;
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/qbank/exam/assemble-or-supplement', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          level,
          mode: 'supplement',
          topic: topic.trim() || undefined,
          supplement_max: 5,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể sinh bù câu hỏi.');
      }

      setGenProgress({ current: 2, total: 2, message: data.message || 'Đã sinh bù thành công.' });
      await loadPoolInspection();

      setTimeout(() => {
        setIsGenerating(false);
      }, 1000);
    } catch (err: any) {
      setIsGenerating(false);
      setGenError(err.message || 'Lỗi sinh bù');
    }
  };

  // Step 5 legacy alias for backwards compatibility
  const handleStartGeneration = handleAssembleFromPool;

  const handleSubmitPreviewExam = () => {
    let correct = 0;
    generatedQuestions.forEach((q, idx) => {
      if (studentAnswers[idx] === q.answer_idx) {
        correct++;
      }
    });
    const total = generatedQuestions.length;
    const bp = DEFAULT_BLUEPRINTS[level] || DEFAULT_BLUEPRINTS[1];
    const score = total > 0 ? Math.round((correct / total) * bp.maxScore) : 0;
    const passed = score >= bp.passScore;
    setPreviewScore({ correct, total, score, passed });
    setIsPreviewSubmitted(true);
  };

  // Inline edit in Step 6
  const handleStartEdit = (q: StudioQuestion) => {
    setEditingQuestionId(q.id);
    setEditFormData({
      stem: q.stem,
      options: [...q.options],
      answer_idx: q.answer_idx,
      pinyin: q.pinyin,
      explanation_vi: q.explanation_vi,
    });
  };

  const handleSaveEdit = (id: string) => {
    setGeneratedQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          return {
            ...q,
            stem: editFormData.stem || q.stem,
            options: editFormData.options || q.options,
            answer_idx: typeof editFormData.answer_idx === 'number' ? editFormData.answer_idx : q.answer_idx,
            pinyin: editFormData.pinyin !== undefined ? editFormData.pinyin : q.pinyin,
            explanation_vi: editFormData.explanation_vi || q.explanation_vi,
          };
        }
        return q;
      })
    );
    setEditingQuestionId(null);
  };

  // Step 7: Assemble Exam
  const handleAssembleExam = async () => {
    setIsSavingExam(true);
    setSaveError(null);
    try {
      const code = `HSK${level}-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const quizQuestions: QuizQuestion[] = generatedQuestions.map((q, idx) => ({
        id: q.id || `q_${Date.now()}_${idx + 1}`,
        prompt: q.stem || ('Câu hỏi số ' + (idx + 1)),
        questionChinese: q.stem,
        options: q.options,
        correctAnswer: (q.options && q.options[q.answer_idx]) || (q.options && q.options[0]) || '',
        explanation: q.explanation_vi || '',
        type: q.skill === 'listening' ? 'listening' : q.skill === 'writing' ? 'writing' : 'fill_blank',
        hskLevel: level as HSKLevel,
      }));

      const newExamDoc: OnlineExamDoc = {
        id: 'exam_' + Date.now(),
        exam_code: code,
        title: examTitle || ('Đề Thi HSK ' + level),
        description: `Đề thi HSK ${level} biên soạn từ AI Exam Studio`,
        hsk_level: level as HSKLevel,
        duration_minutes: totalTimeMin,
        target_type: 'all',
        questions: quizQuestions,
        total_points: (DEFAULT_BLUEPRINTS[level] || DEFAULT_BLUEPRINTS[1])?.maxScore || 100,
        remix_mode: 'original',
        created_by: 'AI Exam Studio',
        created_at: new Date().toISOString(),
        is_active: true,
        level,
        total_time_min: totalTimeMin,
        pass_score: passScore,
        status: 'published',
      } as any;

      await saveOnlineExamToFirestore(newExamDoc);
      setExamCode(code);
      setCreatedExamDoc(newExamDoc);
      setAssemblySuccess(true);
      setSaveError(null);
      try {
        localStorage.removeItem(STORAGE_KEY_STUDIO_DRAFT);
      } catch {}
      if (onExamCreated) {
        onExamCreated(newExamDoc);
      }
    } catch (err: any) {
      console.error('Failed to assemble and save exam:', err);
      const errMsg =
        err?.message ||
        'Không thể lưu trữ đề thi lên Firestore. Vui lòng kiểm tra kết nối mạng hoặc thử lại.';
      setSaveError(errMsg);
    } finally {
      setIsSavingExam(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* DRAFT RESTORATION BANNER */}
      {draftNotice && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold block sm:inline">Phát hiện bản nháp đề thi chưa xuất bản:</span>{' '}
              <span>
                "{draftNotice.title}" ({draftNotice.questionCount} câu hỏi HSK {draftNotice.level}, lưu lúc {draftNotice.timestamp || 'gần đây'}, Bước {draftNotice.step}).
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục bản nháp</span>
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-3 py-1.5 rounded-xl border border-amber-500/40 hover:bg-amber-500/15 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Bỏ qua</span>
            </button>
          </div>
        </div>
      )}

      {/* HEADER & STEPPER PROGRESS */}
      <div className="p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs silk-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  HSK 3.0 Studio
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]">8-Step Guided Builder</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-[var(--color-text-primary)] mt-1">
                AI Exam Studio — Thiết Kế Đề Thi Thông Minh
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="px-3.5 py-2 rounded-xl border border-[var(--color-border)] text-xs font-bold hover:bg-[var(--color-background)] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>
            )}
            {currentStep < 8 && currentStep !== 5 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(8, prev + 1))}
                className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 8-STEP PROGRESS TRACKER */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-6">
          {[
            { step: 1, label: 'Thông tin' },
            { step: 2, label: 'Cấu hình' },
            { step: 3, label: 'Blueprint' },
            { step: 4, label: 'Cài đặt' },
            { step: 5, label: 'Sinh AI' },
            { step: 6, label: 'Kiểm duyệt' },
            { step: 7, label: 'Đóng gói' },
            { step: 8, label: 'Xem trước' },
          ].map(({ step, label }) => {
            const isActive = currentStep === step;
            const isCompleted = currentStep > step;
            return (
              <button
                key={step}
                type="button"
                onClick={() => setCurrentStep(step)}
                className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 font-bold text-[var(--color-primary)]'
                    : isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-secondary)] opacity-70'
                }`}
              >
                <div className="text-[11px] font-black uppercase tracking-wider">
                  BƯỚC {step}
                </div>
                <div className="text-xs truncate mt-0.5">{label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP CONTENT SWITCHER */}
      <div className="p-6 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs silk-card">
        {/* ========================================================================= */}
        {/* STEP 1: EXAM BASIC INFO */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold font-serif text-[var(--color-text-primary)]">
                Bước 1: Thiết Lập Thông Tin Cơ Bản Đề Thi
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
                Khai báo tên gọi, cấp độ năng lực HSK 3.0 và mục đích tổ chức đề thi.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  Tên đề thi (Exam Title) *
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Nhập tên đề thi..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm focus:outline-hidden focus:border-[var(--color-primary)] font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                    Cấp độ HSK 3.0 (Level 1 – 6) *
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm font-semibold focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6].map((lvl) => (
                      <option key={lvl} value={lvl}>
                        HSK {lvl} — {DEFAULT_BLUEPRINTS[lvl]?.name || `Cấp độ ${lvl}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                    Mục đích kỳ thi (Exam Type)
                  </label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm font-semibold focus:outline-hidden focus:border-[var(--color-primary)] cursor-pointer"
                  >
                    <option value="official_mock">Thi Thử Chuẩn (Official Mock Exam)</option>
                    <option value="diagnostic">Khảo Sát Năng Lực Đầu Vào (Diagnostic)</option>
                    <option value="unit_test">Kiểm Tra Định Kỳ (Unit Test)</option>
                    <option value="skill_drill">Luyện Chuyên Đề (Skill Drill)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  Đối tượng học viên áp dụng
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm focus:outline-hidden focus:border-[var(--color-primary)] font-semibold"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Chuyển sang Bước 2: Cấu hình nội dung</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: CONTENT & SKILL CONFIGURATION */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold font-serif text-[var(--color-text-primary)]">
                Bước 2: Cấu Hình Kỹ Năng & Chủ Đề Trọng Tâm
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
                Lựa chọn kỹ năng kiểm tra, chủ đề hội thoại đời sống và tỷ lệ phân bố độ khó.
              </p>
            </div>

            {/* Skill Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                Kỹ năng đưa vào đề thi:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'listening', label: 'Nghe hiểu (Listening)', desc: 'Hội thoại, thông báo, phỏng vấn' },
                  { id: 'reading', label: 'Đọc hiểu (Reading)', desc: 'Điền từ, đoạn văn, văn bản' },
                  { id: 'writing', label: 'Viết (Writing)', desc: 'Sắp xếp trật tự câu, ngữ pháp' },
                ].map(({ id, label, desc }) => {
                  const isChecked = selectedSkills.includes(id);
                  const isDisabled = id === 'writing' && level <= 1;
                  return (
                    <label
                      key={id}
                      className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer ${
                        isDisabled
                          ? 'opacity-40 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                          : isChecked
                          ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                          : 'bg-[var(--color-background)] border-[var(--color-border)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--color-text-primary)]">{label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSkills([...selectedSkills, id]);
                            } else {
                              setSelectedSkills(selectedSkills.filter((s) => s !== id));
                            }
                          }}
                          className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-0 cursor-pointer"
                        />
                      </div>
                      <span className="text-[11px] text-[var(--color-text-secondary)] mt-2">
                        {isDisabled ? 'Không áp dụng cho HSK 1' : desc}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Contextual Topic */}
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                Chủ đề / Ngữ cảnh bài thi (Tự chọn hoặc bỏ trống để phân bố tự do)
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ví dụ: Du lịch & Đặt phòng khách sạn, Môi trường công sở, Mua sắm siêu thị..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm focus:outline-hidden focus:border-[var(--color-primary)] font-semibold"
              />
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                Không giới hạn chủ đề — Hệ thống AI sẽ tích hợp tự nhiên ngữ cảnh này vào các câu hỏi HSK {level}.
              </p>
            </div>

            {/* Visual Questions Toggle */}
            <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                  Bao gồm câu hỏi minh họa Vector SVG (Visual Questions)
                </span>
                <span className="text-[11px] text-[var(--color-text-secondary)]">
                  Chỉ kích hoạt hình ảnh cho dạng bài nhìn tranh nghe/đọc chọn đáp án. Các dạng bài khác hiển thị văn bản thuần túy.
                </span>
              </div>
              <input
                type="checkbox"
                checked={requireVisuals}
                onChange={(e) => setRequireVisuals(e.target.checked)}
                className="w-5 h-5 rounded text-[var(--color-primary)] focus:ring-0 cursor-pointer"
              />
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-bold cursor-pointer"
              >
                ← Bước 1
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Chuyển sang Bước 3: Blueprint đề thi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: OFFICIAL CLEC BLUEPRINT BREAKDOWN */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold font-serif text-[var(--color-text-primary)]">
                Bước 3: Phân Bổ Câu Hỏi Theo Chuẩn Blueprint HSK {level}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
                Khung cấu trúc đề thi chính thức của CLEC / CTI HSK 3.0. Bạn có thể điều chỉnh số lượng từng phần.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/40 text-xs">
              <div>
                <span className="text-[var(--color-text-secondary)]">Tổng thời gian thi:</span>
                <p className="font-bold text-sm text-indigo-700 dark:text-indigo-300 mt-0.5">{totalTimeMin} phút</p>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)]">Điểm tối đa / Điểm đỗ:</span>
                <p className="font-bold text-sm text-indigo-700 dark:text-indigo-300 mt-0.5">
                  {DEFAULT_BLUEPRINTS[level]?.maxScore} / {passScore} điểm
                </p>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)]">Tổng số câu hỏi cấu hình:</span>
                <p className="font-bold text-sm text-indigo-700 dark:text-indigo-300 mt-0.5">{totalQuestionsNeeded} câu</p>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                Chi tiết từng phần thi:
              </span>
              <div className="space-y-2.5">
                {allocations.map((alloc, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-200 dark:bg-gray-800 text-[var(--color-text-primary)]">
                          {alloc.skill}
                        </span>
                        <span className="text-xs font-bold text-[var(--color-text-primary)]">
                          {alloc.part_name_vi}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 font-mono">
                        Mã phần: {alloc.part_type}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-[var(--color-text-secondary)] block">Số câu:</span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={alloc.count}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 1;
                            setAllocations((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, count: val } : item))
                            );
                          }}
                          className="w-16 px-2 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-bold text-center"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-bold cursor-pointer"
              >
                ← Bước 2
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Chuyển sang Bước 4: Kiểm tra thông số</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: REVIEW GENERATION SETTINGS */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold font-serif text-[var(--color-text-primary)]">
                Bước 4: Kiểm Tra Toàn Diện & Chuỗi LLM Waterfall
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
                Xác nhận các thông số trước khi kích hoạt quy trình sinh câu hỏi qua 4 tầng LLM thực tế (Không dùng mock).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
                <span className="text-xs font-bold text-[var(--color-text-secondary)]">Tên đề thi:</span>
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{examTitle}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
                <span className="text-xs font-bold text-[var(--color-text-secondary)]">Cấp độ HSK:</span>
                <span className="text-sm font-bold text-[var(--color-primary)]">HSK {level}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
                <span className="text-xs font-bold text-[var(--color-text-secondary)]">Chủ đề bài thi:</span>
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{topic || 'Tự do / Toàn diện'}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
                <span className="text-xs font-bold text-[var(--color-text-secondary)]">Chuỗi Waterfall LLM:</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  1. DeepSeek-V3 → 2. Gemini 1.5 Flash → 3. Groq → 4. Ollama
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--color-text-secondary)]">Kiểm định chất lượng:</span>
                <span className="text-xs font-bold text-[var(--color-text-primary)]">
                  Chống từ giả POS, Deduplication Jaccard &gt;85%, Lọc ký tự lạ Latin/Việt
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-bold cursor-pointer"
              >
                ← Bước 3
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(5);
                  loadPoolInspection();
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Tiến vào Bước 5: Ghép Đề & Kiểm Tra Kho →</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: POOL-FIRST EXAM ASSEMBLY & BOUNDED SUPPLEMENTATION */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div className="space-y-6 max-w-3xl py-2">
            <div>
              <h2 className="text-lg font-bold font-serif text-[var(--color-text-primary)]">
                Bước 5: Kiểm Định Kho Câu Hỏi & Ghép Đề Thi HSK {level}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
                Ưu tiên 100% câu hỏi đã phê duyệt trong kho dữ liệu (0 API Call). Chỉ gọi AI sinh bù khi kho còn thiếu câu.
              </p>
            </div>

            {isGenerating ? (
              <div className="p-8 text-center rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-5">
                <div className="inline-flex p-4 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] animate-spin">
                  <RefreshCw className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-[var(--color-text-primary)]">
                    Đang Xử Lý Dữ Liệu...
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {genProgress.message}
                  </p>
                </div>
              </div>
            ) : genError ? (
              <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 space-y-3 text-center">
                <AlertTriangle className="w-8 h-8 mx-auto text-rose-500" />
                <h3 className="font-bold text-sm">Thông Báo Quản Trị</h3>
                <p className="text-xs">{genError}</p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={loadPoolInspection}
                    className="px-4 py-2 rounded-xl border border-rose-500/40 text-xs font-bold cursor-pointer"
                  >
                    Tải lại kho
                  </button>
                  <button
                    type="button"
                    onClick={handleSupplementGeneration}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Thử sinh bù lại
                  </button>
                </div>
              </div>
            ) : inspectionLoading ? (
              <div className="p-8 text-center rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--color-primary)]" />
                <p className="text-xs text-[var(--color-text-secondary)] mt-2">Đang quét kho câu hỏi theo Blueprint HSK {level}...</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Status Hero Card */}
                <div className={`p-5 rounded-2xl border ${
                  poolInspection?.isFullyEligible
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {poolInspection?.isFullyEligible ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h3 className="font-bold text-sm">
                        {poolInspection?.isFullyEligible
                          ? 'Kho câu hỏi đã đủ 100% câu đạt chuẩn theo Blueprint HSK'
                          : `Kho câu hỏi còn thiếu ${poolInspection?.totalMissing || 0} câu để đạt chuẩn HSK ${level}`}
                      </h3>
                      <p className="text-xs opacity-90 mt-1">
                        {poolInspection?.isFullyEligible
                          ? 'Bạn có thể ghép đề ngay lập tức từ kho dữ liệu mà KHÔNG TỐN BẤT KỲ LƯỢT GỌI AI NÀO (0 API Call, 0đ).'
                          : 'Hệ thống tuân thủ nghiêm ngặt chuẩn HSK 3.0: chỉ ghép đề thi khi toàn bộ các phần thi đều đủ câu hợp lệ.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section-by-section breakdown table */}
                <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)] text-xs font-bold text-[var(--color-text-secondary)]">
                    <span>Phần thi theo Blueprint</span>
                    <span>Yêu cầu</span>
                    <span>Có sẵn</span>
                    <span>Trạng thái</span>
                  </div>

                  {poolInspection?.sections && Object.entries<any>(poolInspection.sections).map(([sKey, sVal]) => (
                    <div key={sKey} className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--color-border)]/40 last:border-b-0">
                      <span className="font-semibold text-[var(--color-text-primary)]">{sVal.name}</span>
                      <span className="text-[var(--color-text-secondary)]">{sVal.totalRequired} câu</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{sVal.totalAvailable} câu</span>
                      <span className={`font-bold ${sVal.totalMissing === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {sVal.totalMissing === 0 ? '✓ Đủ' : `Thiếu ${sVal.totalMissing}`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-xs font-bold cursor-pointer"
                  >
                    ← Quay lại Bước 4
                  </button>

                  <div className="w-full sm:w-auto flex items-center gap-2">
                    {poolInspection?.isFullyEligible ? (
                      <button
                        type="button"
                        onClick={handleAssembleFromPool}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ghép Đề Ngay Từ Kho (0 API Call) →</span>
                      </button>
                    ) : (
                      <>
                        {onNavigateToTab && (
                          <button
                            type="button"
                            onClick={() => onNavigateToTab('review')}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-xs font-bold cursor-pointer"
                          >
                            Xem & Duyệt câu trong kho
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleSupplementGeneration}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Sinh Bù Có Giới Hạn (Tối đa 5 câu) →</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: QUESTION CURATION & REVIEW */}
        {/* ========================================================================= */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold font-serif text-[var(--color-text-primary)]">
                  Bước 6: Kiểm Duyệt, Chỉnh Sửa & Tinh Chỉnh Câu Hỏi
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
                  Xem lại toàn bộ câu hỏi vừa sinh, chỉnh sửa inline nếu cần, hoặc chấp thuận đưa vào bộ đề thi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                  Đã chấp thuận:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {generatedQuestions.filter((q) => q.status === 'accepted').length}
                  </strong>
                  /{generatedQuestions.length} câu
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {generatedQuestions.map((q, idx) => {
                const isEditing = editingQuestionId === q.id;
                return (
                  <div
                    key={q.id}
                    className="p-5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] shadow-xs space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--color-border)]">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
                          Câu {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase">
                          HSK {q.level} • {q.skill}
                        </span>
                        {q.illustration_theme && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            {formatThemeTag(q.illustration_theme)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[var(--color-text-secondary)]">
                          LLM: {q.provider_used || 'waterfall'}
                        </span>
                        {!isEditing ? (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(q)}
                            className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] text-xs font-semibold hover:bg-[var(--color-surface)] flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Sửa</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(q.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Lưu</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stem & Options */}
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">
                            Câu hỏi (Stem):
                          </label>
                          <textarea
                            value={editFormData.stem || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, stem: e.target.value })}
                            rows={2}
                            className="w-full p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">
                            Phiên âm Pinyin:
                          </label>
                          <input
                            type="text"
                            value={editFormData.pinyin || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, pinyin: e.target.value })}
                            className="w-full p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs italic font-serif"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">
                            Giải thích tiếng Việt:
                          </label>
                          <textarea
                            value={editFormData.explanation_vi || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, explanation_vi: e.target.value })}
                            rows={2}
                            className="w-full p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-base sm:text-lg font-bold font-serif text-[var(--color-text-primary)]">
                          {q.stem}
                        </p>
                        {q.pinyin && (
                          <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 italic font-serif">
                            {q.pinyin}
                          </p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = optIdx === q.answer_idx;
                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${
                                  isCorrect
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-bold'
                                    : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]'
                                }`}
                              >
                                <span>
                                  {String.fromCharCode(65 + optIdx)}. {opt}
                                </span>
                                {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation_vi && (
                          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 text-xs text-[var(--color-text-secondary)] mt-2">
                            <span className="font-bold text-[var(--color-text-primary)] block mb-0.5">
                              Giải thích chi tiết:
                            </span>
                            {q.explanation_vi}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(5);
                  loadPoolInspection();
                }}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-bold cursor-pointer hover:bg-[var(--color-background)] transition-colors"
              >
                ← Bước 5: Kho câu hỏi & ghép đề
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(7)}
                className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Chuyển sang Bước 7: Đóng gói đề thi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 7: ASSEMBLE EXAM PACKAGE */}
        {/* ========================================================================= */}
        {currentStep === 7 && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold font-serif text-[var(--color-text-primary)]">
                Bước 7: Đóng Gói Bộ Đề & Cấp Mã Đề Thi Chuẩn
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
                Tạo mã định danh đề thi, thiết lập thời gian làm bài và sẵn sàng xuất bản vào phòng thi.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-[var(--color-text-secondary)] block">Tên đề thi hoàn thiện:</span>
                  <p className="text-base font-bold text-[var(--color-text-primary)] mt-0.5">{examTitle}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  HSK {level}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[var(--color-border)]">
                <div>
                  <span className="text-[11px] text-[var(--color-text-secondary)]">Thời gian làm bài:</span>
                  <p className="font-bold text-sm text-[var(--color-text-primary)] mt-0.5">{totalTimeMin} phút</p>
                </div>
                <div>
                  <span className="text-[11px] text-[var(--color-text-secondary)]">Số câu hỏi:</span>
                  <p className="font-bold text-sm text-[var(--color-text-primary)] mt-0.5">{generatedQuestions.length} câu</p>
                </div>
                <div>
                  <span className="text-[11px] text-[var(--color-text-secondary)]">Điểm đạt chuẩn:</span>
                  <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">≥ {passScore} điểm</p>
                </div>
              </div>

              {saveError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="font-bold">Lỗi xuất bản đề thi lên máy chủ</span>
                  </div>
                  <p>{saveError}</p>
                  <button
                    type="button"
                    onClick={handleAssembleExam}
                    disabled={isSavingExam}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Thử lại xuất bản đề thi</span>
                  </button>
                </div>
              )}

              {examCode && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold">Đề thi đã đóng gói & lưu vào kho đề thi trực tuyến thành công!</span>
                  </div>
                  <p>Mã định danh đề thi: <strong className="font-mono text-sm">{examCode}</strong></p>
                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(8)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem trước đề thi (Bước 8)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('minnie_switch_tab', { detail: { tab: 'quizzes' } }));
                        if (createdExamDoc) {
                          window.dispatchEvent(new CustomEvent('minnie_launch_exam', { detail: { exam: createdExamDoc } }));
                        }
                        if (onNavigateToTab) {
                          onNavigateToTab('quizzes');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white font-bold text-xs hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Làm bài ngay trong Phòng Thi →</span>
                    </button>
                  </div>
                </div>
              )}

              {!examCode && (
                <button
                  type="button"
                  onClick={handleAssembleExam}
                  disabled={isSavingExam || generatedQuestions.length === 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Award className={`w-4 h-4 ${isSavingExam ? 'animate-spin' : ''}`} />
                  <span>{isSavingExam ? 'Đang lưu trữ & xuất bản đề...' : 'Tạo Mã & Xuất Bản Đề Thi Hoàn Tất'}</span>
                </button>
              )}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-bold cursor-pointer"
              >
                ← Bước 6
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(8)}
                className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Chuyển sang Bước 8: Xem trước đề thi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 8: DUAL-MODE EXAM PREVIEW (STUDENT & TEACHER MODES) */}
        {/* ========================================================================= */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
              <div>
                <h2 className="text-lg font-bold font-serif text-[var(--color-text-primary)]">
                  Bước 8: Trải Nghiệm & Xem Trước Đề Thi Hai Chế Độ
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
                  Chuyển đổi giữa chế độ Học viên (làm bài thực tế) và chế độ Giáo viên (đối soát đáp án & giải thích).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-testid="btn-studio-export-exam"
                  onClick={() => setIsExportModalOpen(true)}
                  disabled={generatedQuestions.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="Xuất toàn bộ đề thi sang Word (.docx), Excel (.xlsx) hoặc JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất đề thi ({generatedQuestions.length})</span>
                </button>

                {/* Mode Toggle */}
                <div className="flex items-center p-1 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('student')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      previewMode === 'student'
                        ? 'bg-[var(--color-primary)] text-white shadow-xs'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Chế độ Học viên (Student)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('teacher')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      previewMode === 'teacher'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Chế độ Giáo viên (Teacher)
                  </button>
                </div>
              </div>
            </div>

            {/* Exam Content Preview */}
            {generatedQuestions.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--color-text-secondary)]">
                Chưa có câu hỏi nào trong đề thi. Vui lòng quay lại Bước 5 để sinh câu hỏi.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Mode Indicator Bar */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    previewMode === 'student'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                      : 'bg-purple-500/10 border-purple-500/30 text-purple-800 dark:text-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {previewMode === 'student' ? <Eye className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>
                      {previewMode === 'student'
                        ? 'Đang ở chế độ Học viên: Đáp án và giải thích bị ẩn hoàn toàn để mô phỏng phòng thi.'
                        : 'Đang ở chế độ Giáo viên: Hiển thị đầy đủ đáp án đúng, gợi ý ngữ pháp và phân tích distractors.'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Thời gian thi: {totalTimeMin}m</span>
                  </div>
                </div>

                {/* Student Score Result Banner if submitted */}
                {previewMode === 'student' && isPreviewSubmitted && previewScore && (
                  <div className={`p-4 rounded-2xl border ${previewScore.passed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'} flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${previewScore.passed ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'}`}>
                        {previewScore.passed ? '🎉' : '⚠️'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">
                          {previewScore.passed ? 'Chúc mừng! Bạn đã thi ĐẠT đề thi này' : 'Chưa đạt điểm qua kỳ thi'}
                        </h4>
                        <p className="text-xs opacity-90">
                          Đúng {previewScore.correct}/{previewScore.total} câu • Điểm số: {previewScore.score}/{(DEFAULT_BLUEPRINTS[level] || DEFAULT_BLUEPRINTS[1]).maxScore} điểm (Điểm chuẩn qua: {(DEFAULT_BLUEPRINTS[level] || DEFAULT_BLUEPRINTS[1]).passScore})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPreviewSubmitted(false);
                        setStudentAnswers({});
                        setPreviewScore(null);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-current text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer self-start sm:self-auto"
                    >
                      Làm lại đề thi
                    </button>
                  </div>
                )}

                {/* Questions List */}
                <div className="space-y-5">
                  {generatedQuestions.map((q, qIdx) => {
                    const studentSelected = studentAnswers[qIdx];
                    return (
                      <div
                        key={q.id}
                        className="p-5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] shadow-xs space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)]">
                            Câu {qIdx + 1}
                          </span>
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            HSK {q.level} • {q.skill}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <p className="text-base sm:text-lg font-bold font-serif text-[var(--color-text-primary)] leading-relaxed">
                            {q.stem}
                          </p>
                          {q.pinyin && (
                            <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 italic font-serif">
                              {q.pinyin}
                            </p>
                          )}
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {q.options.map((opt, optIdx) => {
                            const isChosenByStudent = studentSelected === optIdx;
                            const isCorrect = optIdx === q.answer_idx;

                            let optionClasses = 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]';
                            if (previewMode === 'teacher') {
                              if (isCorrect) {
                                optionClasses = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold';
                              }
                            } else if (isPreviewSubmitted) {
                              if (isCorrect) {
                                optionClasses = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold';
                              } else if (isChosenByStudent) {
                                optionClasses = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-300 font-bold';
                              }
                            } else {
                              if (isChosenByStudent) {
                                optionClasses = 'bg-[var(--color-primary)]/15 border-[var(--color-primary)] text-[var(--color-primary)] font-bold';
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => {
                                  if (previewMode === 'student') {
                                    setStudentAnswers({ ...studentAnswers, [qIdx]: optIdx });
                                  }
                                }}
                                className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs sm:text-sm transition-all cursor-pointer ${optionClasses}`}
                              >
                                <span>
                                  {String.fromCharCode(65 + optIdx)}. {opt}
                                </span>
                                {previewMode === 'teacher' && isCorrect && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Teacher Mode Explanations */}
                        {previewMode === 'teacher' && q.explanation_vi && (
                          <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 text-xs space-y-1">
                            <span className="font-bold text-purple-900 dark:text-purple-300 block">
                              Đáp án & Phân tích sư phạm:
                            </span>
                            <p className="text-[var(--color-text-secondary)]">{q.explanation_vi}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submit button for Student mode */}
                {previewMode === 'student' && !isPreviewSubmitted && (
                  <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <h4 className="font-bold text-sm text-[var(--color-text-primary)]">
                        Đã chọn đáp án {Object.keys(studentAnswers).length}/{generatedQuestions.length} câu hỏi
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Bấm nộp bài để xem ngay kết quả chấm thi tự động và đối chiếu tỷ lệ đúng.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSubmitPreviewExam}
                      disabled={Object.keys(studentAnswers).length === 0}
                      className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Nộp bài & Chấm điểm thi thử</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(7)}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-bold cursor-pointer"
              >
                ← Bước 7
              </button>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('minnie_switch_tab', { detail: { tab: 'quizzes' } }));
                  if (createdExamDoc) {
                    window.dispatchEvent(new CustomEvent('minnie_launch_exam', { detail: { exam: createdExamDoc } }));
                  }
                  if (onNavigateToTab) {
                    onNavigateToTab('quizzes');
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer"
              >
                Đi Đến Phòng Thi HSK Mock Exam →
              </button>
            </div>
          </div>
        )}
      </div>

      <ExportExamModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={`Xuất đề thi: ${examTitle || 'Đề Thi HSK Minnese'}`}
        count={generatedQuestions.length}
        questions={generatedQuestions}
        defaultExamTitle={examTitle || `De_Thi_HSK_${level}`}
      />
    </div>
  );
};
