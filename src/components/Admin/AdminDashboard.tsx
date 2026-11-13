import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Database,
  BookOpen,
  Plus,
  Trash2,
  Search,
  Sparkles,
  BarChart3,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  RefreshCw,
  FolderSearch,
  Code,
  ShieldCheck,
  AlertCircle,
  Save,
  GraduationCap,
  Copy,
  Layers,
  Edit2,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  Unlock,
  Shield,
  Eye,
  Filter,
  UserCheck,
  UserX,
  PenTool,
  HelpCircle,
  ListChecks,
  FileQuestion,
  Play,
  Check,
  ExternalLink,
} from 'lucide-react';
import {
  WordItem,
  RAGDocument,
  HSKLevel,
  UserProfile,
  ClassDoc,
  AssignmentDoc,
  AssignmentSubmissionDoc,
  PromptTemplateDoc,
  FileSearchStoreDoc,
  OnlineExamDoc,
  QuizQuestion,
} from '../../types';
import {
  getUnifiedVocabularyList,
  saveOrUpdateWord,
  deleteWordItem,
  saveCustomVocabList,
  getCustomVocabList,
} from '../../utils/vocabStorage';
import { INITIAL_RAG_DOCUMENTS, queryKnowledgeBase } from '../../data/ragKnowledgeBase';
import {
  seedDemoData,
  fetchAllStudentsFromFirestore,
  updateStudentInFirestore,
  deleteStudentInFirestore,
  fetchClassesFromFirestore,
  saveClassToFirestore,
  deleteClassInFirestore,
  fetchAssignmentsFromFirestore,
  saveAssignmentToFirestore,
  deleteAssignmentInFirestore,
  fetchFileSearchStoresFromFirestore,
  saveFileSearchStoreToFirestore,
  deleteFileSearchStoreInFirestore,
  fetchSubmissionsFromFirestore,
  saveSubmissionToFirestore,
  fetchOnlineExamsFromFirestore,
  saveOnlineExamToFirestore,
  deleteOnlineExamInFirestore,
  ADMIN_EMAILS,
  addAdminEmailToFirestore,
  removeAdminEmailFromFirestore,
  fetchDynamicAdminEmails,
  listenToDynamicAdmins,
} from '../../lib/firebase';
import { DocumentUploadModal, UploadVocabItem } from './DocumentUploadModal';
import { ZaloNotificationModal } from './ZaloNotificationModal';
import { WorkbookStudio } from './WorkbookStudio';
import { HomeworkWizardModal } from './HomeworkWizardModal';
import { TeacherVoiceRecorder } from '../Feedback/TeacherVoiceRecorder';
import { TeacherVoicePlayer } from '../Feedback/TeacherVoicePlayer';

interface AdminDashboardProps {
  currentAdmin?: UserProfile;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentAdmin }) => {
  const [activeTab, setActiveTab] = useState<
    'classes' | 'students' | 'admins' | 'assignments' | 'workbooks' | 'vocab' | 'rag' | 'prompts' | 'tester'
  >('classes');

  // Identify current Admin/Teacher
  const currentAdminEmail = (currentAdmin?.email || '').toLowerCase().trim();
  const currentAdminName = currentAdmin?.displayName || (currentAdminEmail ? currentAdminEmail.split('@')[0] : 'Quản trị viên');
  const currentAdminId = currentAdmin?.id || '';

  const isAuthorized = Boolean(
    currentAdmin &&
    (currentAdmin.role === 'admin' || currentAdmin.role === 'teacher')
  );

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-[var(--color-surface)] border border-rose-500/30 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto text-2xl">
          🛡️
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] font-serif">Quyền Truy Cập Bị Giới Hạn</h2>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Khu vực Quản trị chỉ dành riêng cho Giáo viên và Ban Quản trị Minnese. Tài khoản học viên của bạn ({currentAdmin?.email || 'Chưa xác thực'}) không có quyền truy cập trang này.
        </p>
      </div>
    );
  }

  // Dynamic Admins & Role Management States
  const [dynamicAdmins, setDynamicAdmins] = useState<string[]>(ADMIN_EMAILS);
  const [newAdminEmailInput, setNewAdminEmailInput] = useState('');
  const [newAdminNameInput, setNewAdminNameInput] = useState('');
  const [newAdminRoleInput, setNewAdminRoleInput] = useState<'admin' | 'teacher'>('admin');
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'teacher' | 'user'>('all');

  // Student Progress & Class Details Inspection
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<UserProfile | null>(null);
  const [selectedAsgForSubmissions, setSelectedAsgForSubmissions] = useState<AssignmentDoc | null>(null);
  const [selectedSubmissionForDetail, setSelectedSubmissionForDetail] = useState<AssignmentSubmissionDoc | null>(null);
  const [manualScore, setManualScore] = useState<number>(0);
  const [manualFeedback, setManualFeedback] = useState<string>('');
  const [manualVoiceUrl, setManualVoiceUrl] = useState<string>('');
  const [manualVoiceDuration, setManualVoiceDuration] = useState<number>(0);
  const [manualPronunciationNotes, setManualPronunciationNotes] = useState<string[]>([]);
  const [isSavingGrading, setIsSavingGrading] = useState<boolean>(false);
  const [inspectingClass, setInspectingClass] = useState<ClassDoc | null>(null);

  // Seed notification state & Data loading state
  const [seedLoading, setSeedLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [seedToast, setSeedToast] = useState<{ success: boolean; message: string } | null>(null);

  // Real Database States (initialized empty, populated purely from Firestore)
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDoc[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionDoc[]>([]);
  const [onlineExams, setOnlineExams] = useState<OnlineExamDoc[]>([]);
  const [fileStores, setFileStores] = useState<FileSearchStoreDoc[]>([]);

  // Super Admin (root owner) vs Sub-Admin (granted admin/teacher with class-student detail isolation)
  const isSuperAdmin = useMemo(() => {
    return (
      currentAdminEmail === 'babysharkkk123@gmail.com' ||
      (currentAdmin as any)?.admin_tier === 'super_admin'
    );
  }, [currentAdminEmail, currentAdmin]);

  // Ownership verification functions: strict per-teacher class & student privacy
  const isClassOwner = (cls: ClassDoc): boolean => {
    if (!cls) return false;
    const createdBy = (cls.created_by || '').toLowerCase().trim();
    const teacherName = (cls.teacher_name || '').toLowerCase().trim();
    const emailPrefix = currentAdminEmail.split('@')[0]?.toLowerCase() || '';
    const adminNameLower = (currentAdminName || '').toLowerCase().trim();

    if (createdBy && createdBy === currentAdminEmail) return true;
    if (currentAdmin?.id && cls.teacher_id && cls.teacher_id === currentAdmin.id) return true;
    if (teacherName && adminNameLower && teacherName === adminNameLower) return true;
    if (emailPrefix && teacherName && teacherName.includes(emailPrefix)) return true;
    return false;
  };

  const myClasses = useMemo(() => classes.filter(isClassOwner), [classes, currentAdminEmail]);

  const isStudentInMyClass = (st: UserProfile): boolean => {
    if (!st.class_id && !st.class_code) return false;
    return myClasses.some((c) => c.id === st.class_id || c.class_code === st.class_code);
  };

  const isAssignmentOwner = (asg: AssignmentDoc): boolean => {
    if (currentAdmin?.role === 'admin' || currentAdminEmail.includes('admin') || currentAdminEmail.includes('babysharkkk123')) return true;
    const createdBy = (asg.created_by || '').toLowerCase();
    if (createdBy === currentAdminEmail) return true;
    if (asg.target_class_id && myClasses.some((c) => c.id === asg.target_class_id)) return true;
    return false;
  };

  // New Class Form State
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState<number>(1);
  const [newClassTeacher, setNewClassTeacher] = useState(currentAdminName);

  // Scope and Privacy Filter States
  const [classScope, setClassScope] = useState<'my_classes' | 'all_classes'>('my_classes');
  const [studentFilter, setStudentFilter] = useState<'my_students' | 'all_students' | 'unassigned'>('my_students');
  const [assignmentScope, setAssignmentScope] = useState<'my_assignments' | 'all_assignments'>('my_assignments');

  const [showPrivacyNotice, setShowPrivacyNotice] = useState<boolean>(false);
  const [showAdvancedTools, setShowAdvancedTools] = useState<boolean>(false);
  const myClassIdSet = useMemo(() => new Set(myClasses.map((c) => c.id)), [myClasses]);
  const myClassCodeSet = useMemo(() => new Set(myClasses.map((c) => c.class_code)), [myClasses]);

  const displayedClasses = useMemo(() => {
    if (classScope === 'my_classes') {
      return myClasses;
    }
    return classes;
  }, [classScope, myClasses, classes]);

  const displayedStudents = useMemo(() => {
    return students.filter((s) => {
      const isInMyClass =
        (s.class_id && myClassIdSet.has(s.class_id)) ||
        (s.class_code && myClassCodeSet.has(s.class_code));
      const isUnassigned = !s.class_id && !s.class_code;

      if (studentFilter === 'my_students') {
        return Boolean(isInMyClass);
      }
      if (studentFilter === 'unassigned') {
        return isUnassigned;
      }
      // Super Admin sees all students; Sub-Admins/Teachers only see their own class students + unassigned students
      if (isSuperAdmin) {
        return true;
      }
      return Boolean(isInMyClass) || isUnassigned;
    });
  }, [students, studentFilter, myClassIdSet, myClassCodeSet, isSuperAdmin]);

  // Check if an assignment has passed its deadline
  const isAssignmentExpired = (asg: AssignmentDoc): boolean => {
    if (!asg.due_date) return false;
    const dueTime = new Date(asg.due_date).getTime();
    if (isNaN(dueTime)) return false;
    return dueTime <= Date.now();
  };

  const displayedAssignments = useMemo(() => {
    const active = assignments.filter((a) => !isAssignmentExpired(a));
    if (assignmentScope === 'my_assignments') {
      return active.filter(isAssignmentOwner);
    }
    return active;
  }, [assignmentScope, assignments, isAssignmentOwner]);

  const getDefaultDueDateTimeString = () => {
    const d = new Date(Date.now() + 3 * 86400000);
    d.setHours(23, 59, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59`;
  };

  // New assignment form state
  const [showAddAssignModal, setShowAddAssignModal] = useState(false);
  const [selectedZaloAssignment, setSelectedZaloAssignment] = useState<AssignmentDoc | null>(null);
  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignDesc, setNewAssignDesc] = useState('');
  const [newAssignTargetType, setNewAssignTargetType] = useState<'class' | 'level'>('class');
  const [newAssignTargetClass, setNewAssignTargetClass] = useState<string>('');
  const [newAssignLevel, setNewAssignLevel] = useState<number>(1);
  const [newAssignType, setNewAssignType] = useState<'quiz' | 'deck' | 'reading' | 'writing'>('quiz');
  const [newAssignDueDate, setNewAssignDueDate] = useState<string>('');

  // Assignment content-specific states
  const [quizSourceType, setQuizSourceType] = useState<'existing_exam' | 'ai_generate' | 'hsk_standard'>('existing_exam');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [aiQuizTopic, setAiQuizTopic] = useState<string>('Từ vựng & Ngữ pháp trọng tâm HSK');
  const [aiQuizCount, setAiQuizCount] = useState<number>(10);
  const [isGeneratingQuizAI, setIsGeneratingQuizAI] = useState<boolean>(false);
  const [generatedQuizQuestions, setGeneratedQuizQuestions] = useState<QuizQuestion[]>([]);

  // Flashcards state
  const [deckWordCount, setDeckWordCount] = useState<number>(15);
  const [deckTopic, setDeckTopic] = useState<string>('Từ vựng cốt lõi & giao tiếp đời sống');

  // Reading state
  const [readingTopic, setReadingTopic] = useState<string>('Hoạt động học tập & Đời sống hàng ngày');

  // Writing state
  const [writingPrompt, setWritingPrompt] = useState<string>('Luyện viết chữ Hán và viết đoạn văn ngắn 50 chữ giới thiệu bản thân.');

  // Preview Questions Modal
  const [previewExamDetail, setPreviewExamDetail] = useState<{ title: string; questions: QuizQuestion[]; code?: string } | null>(null);
  const [viewingAssignmentDetail, setViewingAssignmentDetail] = useState<AssignmentDoc | null>(null);

  // Vocab state
  const [vocabList, setVocabList] = useState<WordItem[]>(getUnifiedVocabularyList);
  const [vocabSearch, setVocabSearch] = useState('');
  const [vocabLevelFilter, setVocabLevelFilter] = useState<number | 'all'>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Pagination for vocabulary
  const [vocabPage, setVocabPage] = useState(1);
  const VOCAB_PER_PAGE = 25;

  // Single Add / Edit Word Modal State
  const [editingWord, setEditingWord] = useState<WordItem | null>(null);
  const [showAddSingleModal, setShowAddSingleModal] = useState(false);
  const [wordToDelete, setWordToDelete] = useState<WordItem | null>(null);
  const [editFormHanzi, setEditFormHanzi] = useState('');
  const [editFormPinyin, setEditFormPinyin] = useState('');
  const [editFormHanViet, setEditFormHanViet] = useState('');
  const [editFormVietnamese, setEditFormVietnamese] = useState('');
  const [editFormLevel, setEditFormLevel] = useState<HSKLevel>(1);
  const [editFormExample, setEditFormExample] = useState('');
  const [editFormExampleTranslation, setEditFormExampleTranslation] = useState('');

  // Fetch purely real registered students, classes, assignments, stores from Firestore
  const loadRealData = async () => {
    setIsLoadingData(true);
    try {
      const [realUsers, realClasses, realAssignments, realFileStores, realSubmissions, realExams] = await Promise.all([
        fetchAllStudentsFromFirestore(),
        fetchClassesFromFirestore(),
        fetchAssignmentsFromFirestore(),
        fetchFileSearchStoresFromFirestore(),
        fetchSubmissionsFromFirestore(),
        fetchOnlineExamsFromFirestore(),
      ]);

      let mergedSubmissions = realSubmissions || [];
      try {
        const localSubs: AssignmentSubmissionDoc[] = JSON.parse(localStorage.getItem('minnese_local_submissions') || '[]');
        const existingIds = new Set(mergedSubmissions.map((s) => s.id));
        for (const ls of localSubs) {
          if (!existingIds.has(ls.id)) mergedSubmissions.push(ls);
        }
      } catch (e) {}

      let mergedExams = realExams || [];
      try {
        const localExams: OnlineExamDoc[] = JSON.parse(localStorage.getItem('minnese_local_online_exams') || '[]');
        const existingIds = new Set(mergedExams.map((e) => e.id));
        for (const le of localExams) {
          if (!existingIds.has(le.id)) mergedExams.push(le);
        }
      } catch (e) {}

      // Filter & purge any expired assignments
      const activeAssignments = (realAssignments || []).filter((a) => !isAssignmentExpired(a));
      const expiredAssignments = (realAssignments || []).filter(isAssignmentExpired);
      if (expiredAssignments.length > 0) {
        expiredAssignments.forEach((exp) => {
          deleteAssignmentInFirestore(exp.id).catch(console.warn);
          if (exp.content_ref_id) {
            deleteOnlineExamInFirestore(exp.content_ref_id).catch(console.warn);
          }
        });
      }

      setStudents(realUsers || []);
      setClasses(realClasses || []);
      setAssignments(activeAssignments);
      setFileStores(realFileStores || []);
      setSubmissions(mergedSubmissions);
      setOnlineExams(mergedExams);
    } catch (err) {
      console.warn('Could not load real data from Firestore:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Periodic sweep to automatically remove expired assignments every 15 seconds
  useEffect(() => {
    const sweepInterval = setInterval(() => {
      setAssignments((prev) => {
        const expired = prev.filter(isAssignmentExpired);
        if (expired.length === 0) return prev;
        expired.forEach((exp) => {
          deleteAssignmentInFirestore(exp.id).catch(console.warn);
          if (exp.content_ref_id) {
            deleteOnlineExamInFirestore(exp.content_ref_id).catch(console.warn);
          }
        });
        return prev.filter((a) => !isAssignmentExpired(a));
      });
    }, 15000);

    return () => clearInterval(sweepInterval);
  }, []);

  // Sync vocab on external update & Initial load of Firestore data
  useEffect(() => {
    const syncVocab = () => {
      setVocabList(getUnifiedVocabularyList());
    };
    window.addEventListener('storage', syncVocab);
    window.addEventListener('minnese_vocab_updated', syncVocab);

    loadRealData();

    return () => {
      window.removeEventListener('storage', syncVocab);
      window.removeEventListener('minnese_vocab_updated', syncVocab);
    };
  }, []);

  // Dynamic Admin listener
  useEffect(() => {
    const unsub = listenToDynamicAdmins((updatedList) => {
      setDynamicAdmins(updatedList);
    });
    fetchDynamicAdminEmails().then((list) => setDynamicAdmins(list));
    return () => unsub();
  }, []);

  const handleUpdateStudentRole = async (userId: string, newRole: 'user' | 'teacher' | 'admin', userEmail: string) => {
    const success = await updateStudentInFirestore(userId, { role: newRole });
    if (success) {
      if (newRole === 'admin') {
        await addAdminEmailToFirestore(userEmail);
      } else {
        await removeAdminEmailFromFirestore(userEmail, newRole);
      }
      const updatedList = await fetchDynamicAdminEmails();
      setDynamicAdmins(updatedList);
      setStudents((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, role: newRole } : s))
      );
      setSeedToast({
        success: true,
        message: `Đã cập nhật vai trò của "${userEmail}" thành "${newRole === 'admin' ? 'Quản trị viên (Admin)' : newRole === 'teacher' ? 'Giáo viên (Teacher)' : 'Học viên (User)'}".`,
      });
    } else {
      setSeedToast({
        success: false,
        message: 'Không thể cập nhật vai trò người dùng.',
      });
    }
  };

  const handleAddNewAdminOrTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmailInput.trim()) return;
    setIsSubmittingAdmin(true);
    try {
      const email = newAdminEmailInput.trim().toLowerCase();
      if (newAdminRoleInput === 'admin') {
        const res = await addAdminEmailToFirestore(email);
        if (!res.success) {
          setSeedToast({ success: false, message: res.message });
          setIsSubmittingAdmin(false);
          return;
        }
      }
      // If user exists in Firestore, update their role
      const existingUser = students.find((s) => (s.email || '').toLowerCase() === email);
      if (existingUser) {
        await updateStudentInFirestore(existingUser.id, { role: newAdminRoleInput });
        setStudents((prev) =>
          prev.map((s) => (s.id === existingUser.id ? { ...s, role: newAdminRoleInput } : s))
        );
      }
      setNewAdminEmailInput('');
      setNewAdminNameInput('');
      const updatedAdmins = await fetchDynamicAdminEmails();
      setDynamicAdmins(updatedAdmins);
      setSeedToast({
        success: true,
        message: `🎉 Đã cấp quyền ${newAdminRoleInput === 'admin' ? 'Quản trị viên (Admin)' : 'Giáo viên'} cho email "${email}" thành công! Người này có thể đăng nhập ngay mà không cần sửa code.`,
      });
    } catch (err: any) {
      setSeedToast({ success: false, message: err?.message || 'Có lỗi xảy ra khi cấp quyền.' });
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleRevokeAdminAccess = async (targetEmail: string) => {
    if (targetEmail.toLowerCase() === 'babysharkkk123@gmail.com') {
      alert('Không thể xóa quyền Quản trị viên gốc của tài khoản chủ sở hữu.');
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn thu hồi quyền Admin của "${targetEmail}" không? Người này sẽ chuyển về quyền Học viên.`)) {
      return;
    }
    const res = await removeAdminEmailFromFirestore(targetEmail, 'user');
    setSeedToast(res);
    const updated = await fetchDynamicAdminEmails();
    setDynamicAdmins(updated);
    setStudents((prev) =>
      prev.map((s) => (s.email.toLowerCase() === targetEmail.toLowerCase() ? { ...s, role: 'user' } : s))
    );
  };

  // Update target class default when myClasses updates
  useEffect(() => {
    if (myClasses.length > 0 && !newAssignTargetClass) {
      setNewAssignTargetClass(myClasses[0].id);
    }
  }, [myClasses, newAssignTargetClass]);


  const handleOpenEditModal = (word: WordItem) => {
    setEditingWord(word);
    setEditFormHanzi(word.hanzi);
    setEditFormPinyin(word.pinyin);
    setEditFormHanViet(word.hanViet || '');
    setEditFormVietnamese(word.vietnamese || word.english || '');
    setEditFormLevel(word.hskLevel || 1);
    setEditFormExample(word.example || (word.examples?.[0]?.chinese || word.examples?.[0]?.hanzi || ''));
    setEditFormExampleTranslation(
      word.exampleTranslation || (word.examples?.[0]?.vietnamese || word.examples?.[0]?.english || '')
    );
    setShowAddSingleModal(true);
  };

  const handleOpenAddSingleModal = () => {
    setEditingWord(null);
    setEditFormHanzi('');
    setEditFormPinyin('');
    setEditFormHanViet('');
    setEditFormVietnamese('');
    setEditFormLevel(1);
    setEditFormExample('');
    setEditFormExampleTranslation('');
    setShowAddSingleModal(true);
  };

  const handleSaveWordForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormHanzi.trim() || !editFormPinyin.trim()) return;

    try {
      const updatedWord: WordItem = {
        ...(editingWord || {}),
        id: editingWord?.id || `custom-word-${Date.now()}`,
        hanzi: editFormHanzi.trim(),
        pinyin: editFormPinyin.trim(),
        hanViet: editFormHanViet.trim() || undefined,
        vietnamese: editFormVietnamese.trim(),
        english: editFormVietnamese.trim(),
        hskLevel: editFormLevel,
        partOfSpeech: editingWord?.partOfSpeech || 'noun',
        radical: editFormHanzi.trim().charAt(0),
        strokeCount: editFormHanzi.trim().length * 4,
        example: editFormExample.trim() || undefined,
        exampleTranslation: editFormExampleTranslation.trim() || undefined,
        examples: editFormExample.trim()
          ? [
              {
                chinese: editFormExample.trim(),
                hanzi: editFormExample.trim(),
                pinyin: '',
                english: editFormExampleTranslation.trim() || '',
                vietnamese: editFormExampleTranslation.trim() || '',
              },
            ]
          : editingWord?.examples || [],
      };

      saveOrUpdateWord(updatedWord, editingWord?.hanzi);
      setVocabList(getUnifiedVocabularyList());

      setShowAddSingleModal(false);
      setEditingWord(null);
      setSeedToast({
        success: true,
        message: `✨ Đã lưu từ "${updatedWord.hanzi}" (${updatedWord.pinyin}) và đồng bộ tức thì sang Từ Điển & Flashcards!`,
      });
      setTimeout(() => setSeedToast(null), 4000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleConfirmDelete = () => {
    if (!wordToDelete) return;
    try {
      deleteWordItem(wordToDelete);
      setVocabList(getUnifiedVocabularyList());
      setSeedToast({
        success: true,
        message: `Đã xóa từ "${wordToDelete.hanzi}" khỏi hệ thống & Từ Điển!`,
      });
      setWordToDelete(null);
      setTimeout(() => setSeedToast(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImportWords = async (newWords: UploadVocabItem[]) => {
    const formattedWords: WordItem[] = newWords.map((w, idx) => ({
      ...w,
      hskLevel: (w.hskLevel || 1) as HSKLevel,
      id: `vocab-import-${Date.now()}-${idx}`,
    }));

    try {
      const existingList = getCustomVocabList();
      const map = new Map<string, WordItem>();
      formattedWords.forEach((w) => map.set(w.hanzi, w));
      existingList.forEach((w) => {
        if (!map.has(w.hanzi)) {
          map.set(w.hanzi, w);
        }
      });
      const updatedCustom = Array.from(map.values());
      saveCustomVocabList(updatedCustom);
      setVocabList(getUnifiedVocabularyList());
    } catch (e) {
      console.error('Error saving imported words', e);
    }

    setSeedToast({
      success: true,
      message: `✨ Đã nhập thành công ${formattedWords.length} từ vựng vào hệ thống & đồng bộ ngay với Từ Điển & Flashcards!`,
    });
    setTimeout(() => setSeedToast(null), 5000);
  };

  const handleUploadRagFile = async (fileName: string, _fileSize: string, _contentSummary: string) => {
    const newFileItem = {
      file_name: fileName,
      uploaded_at: new Date().toISOString().split('T')[0],
      status: 'INDEXED' as const,
    };

    let targetStore: FileSearchStoreDoc;
    if (fileStores.length > 0) {
      targetStore = {
        ...fileStores[0],
        files_uploaded: [newFileItem, ...(fileStores[0].files_uploaded || [])],
      };
    } else {
      targetStore = {
        id: `store-${Date.now()}`,
        store_name: `store-tailieu-${Date.now().toString().slice(-6)}`,
        display_name: 'Kho tài liệu giáo trình & Ngữ pháp',
        category: 'grammar',
        hsk_level: 1,
        files_uploaded: [newFileItem],
        createdAt: new Date().toISOString().split('T')[0],
      };
    }

    setFileStores((prev) => {
      const exists = prev.some((s) => s.id === targetStore.id);
      if (exists) {
        return prev.map((s) => (s.id === targetStore.id ? targetStore : s));
      }
      return [targetStore, ...prev];
    });

    await saveFileSearchStoreToFirestore(targetStore);

    setSeedToast({
      success: true,
      message: `✨ Đã nạp và lập chỉ mục file "${fileName}" vào Kho tài liệu Firestore thành công!`,
    });
    setTimeout(() => setSeedToast(null), 5000);
  };

  const handleDeleteFileStore = async (storeId: string, storeTitle: string) => {
    const confirmDel = window.confirm(`Bạn có chắc chắn muốn xóa kho tài liệu "${storeTitle}" khỏi Firestore?`);
    if (!confirmDel) return;

    setFileStores((prev) => prev.filter((s) => s.id !== storeId));
    await deleteFileSearchStoreInFirestore(storeId);
    setSeedToast({
      success: true,
      message: `Đã xóa kho tài liệu "${storeTitle}" khỏi cơ sở dữ liệu.`,
    });
    setTimeout(() => setSeedToast(null), 4000);
  };

  // Prompt Templates
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplateDoc[]>([
    {
      id: 'flashcard_generation',
      name: 'flashcard_generation',
      system_prompt:
        'Bạn là chuyên gia sư phạm tiếng Trung HSK cho người Việt. Dựa trên tài liệu File Search được cung cấp, hãy phân tích đoạn văn và trích xuất danh sách từ vựng/ngữ pháp chuẩn HSK.',
      variables: ['{{user_text}}', '{{hsk_level}}'],
      target_store_names: ['store-tuvung-hsk', 'store-nguphap-hsk'],
      version: 1,
      is_active: true,
    },
    {
      id: 'quiz_generation',
      name: 'quiz_generation',
      system_prompt:
        'Bạn là giám khảo biên soạn đề thi HSK. Dựa trên File Search store của level được chọn, hãy tạo các câu hỏi trắc nghiệm kiểm tra từ vựng, ngữ pháp kèm giải thích chi tiết có trích dẫn nguồn.',
      variables: ['{{hsk_level}}', '{{count}}', '{{topic}}'],
      target_store_names: ['store-nguphap-hsk'],
      version: 1,
      is_active: true,
    },
  ]);

  // RAG Docs & Tester
  const [ragDocs] = useState<RAGDocument[]>(INITIAL_RAG_DOCUMENTS);
  const [testQuery, setTestQuery] = useState('第三声变调规则是什么？ Quy tắc biến điệu thanh 3 là gì?');
  const [retrievedResults, setRetrievedResults] = useState<RAGDocument[]>([]);

  useEffect(() => {
    if (testQuery) {
      setRetrievedResults(queryKnowledgeBase(testQuery, 3));
    }
  }, []);

  const handleSeedData = async () => {
    setSeedLoading(true);
    setSeedToast(null);
    try {
      const res = await seedDemoData();
      setSeedToast(res);
    } catch (e: any) {
      setSeedToast({ success: false, message: e?.message || 'Có lỗi xảy ra khi nạp dữ liệu mẫu.' });
    } finally {
      setSeedLoading(false);
    }
  };

  const generateRandomClassCode = (hskLevel: number) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `HSK${hskLevel}-${rand}`;
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const generatedCode = generateRandomClassCode(newClassLevel);
    const newCls: ClassDoc = {
      id: `cls-${Date.now()}`,
      class_name: newClassName.trim(),
      class_code: generatedCode,
      hsk_level: newClassLevel,
      teacher_id: currentAdminId,
      teacher_name: newClassTeacher || currentAdminName,
      created_by: currentAdminEmail,
      created_at: new Date().toISOString().split('T')[0],
      student_count: 0,
      is_active: true,
    };

    setClasses([newCls, ...classes]);
    setShowAddClassModal(false);
    setNewClassName('');

    // Persist to Firestore
    await saveClassToFirestore(newCls);
    setSeedToast({
      success: true,
      message: `✨ Đã tạo lớp riêng tư "${newCls.class_name}" (Mã: ${newCls.class_code}) thành công!`,
    });
    setTimeout(() => setSeedToast(null), 5000);
  };

  const handleRegenerateCode = async (classId: string, level: number) => {
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return;

    if (!isClassOwner(targetClass)) {
      alert('⚠️ QUYỀN RIÊNG TƯ: Bạn chỉ có thể tạo lại mã cho lớp do chính bạn tạo và phụ trách!');
      return;
    }

    const newCode = generateRandomClassCode(level);
    const updatedClass = { ...targetClass, class_code: newCode };

    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? updatedClass : c))
    );
    await saveClassToFirestore(updatedClass);
    alert(`Đã cập nhật mã lớp mới: ${newCode}`);
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return;

    if (!isClassOwner(targetClass)) {
      alert('⚠️ QUYỀN RIÊNG TƯ: Bạn không thể xóa lớp học của Giáo viên/Admin khác!');
      return;
    }

    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn XÓA LỚP "${className}"? Toàn bộ học viên trong lớp sẽ trở về trạng thái Tự do.`
    );
    if (!confirmDelete) return;

    setClasses((prev) => prev.filter((c) => c.id !== classId));
    await deleteClassInFirestore(classId);

    // Unassign students of this class
    setStudents((prev) =>
      prev.map((st) => (st.class_id === classId ? { ...st, class_id: undefined, class_code: undefined } : st))
    );
    alert(`Đã xóa lớp "${className}" thành công.`);
  };

  const handleToggleClassActive = async (classId: string) => {
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return;

    if (!isClassOwner(targetClass)) {
      alert('⚠️ QUYỀN RIÊNG TƯ: Bạn chỉ có thể đóng/mở lớp do chính mình quản lý!');
      return;
    }

    const updated = { ...targetClass, is_active: !targetClass.is_active };
    setClasses((prev) => prev.map((c) => (c.id === classId ? updated : c)));
    await saveClassToFirestore(updated);
  };

  const handleUpdateStudentLevel = async (studentId: string, newLevel: number) => {
    const st = students.find((s) => s.id === studentId);
    if (st && st.class_id) {
      const studentClass = classes.find((c) => c.id === st.class_id);
      if (studentClass && !isClassOwner(studentClass)) {
        alert(`⚠️ QUYỀN RIÊNG TƯ: Học viên "${st.displayName}" đang theo học lớp của GV "${studentClass.teacher_name || studentClass.created_by}". Bạn không thể thay đổi cấp độ của học viên này.`);
        return;
      }
    }

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              current_level: newLevel,
              current_level_updated_at: new Date().toISOString(),
              current_level_updated_by: currentAdminEmail,
            }
          : s
      )
    );
    await updateStudentInFirestore(studentId, {
      current_level: newLevel,
      current_level_updated_at: new Date().toISOString(),
      current_level_updated_by: currentAdminEmail,
    });
  };

  const handleUpdateStudentClass = async (studentId: string, targetClassId: string) => {
    const st = students.find((s) => s.id === studentId);
    if (!st) return;

    // If currently enrolled in another teacher's class, block modification
    if (st.class_id) {
      const currentClass = classes.find((c) => c.id === st.class_id);
      if (currentClass && !isClassOwner(currentClass)) {
        alert(`⚠️ QUYỀN RIÊNG TƯ: Học viên "${st.displayName}" đang thuộc lớp của GV "${currentClass.teacher_name}". Bạn không có quyền chuyển hoặc gỡ học viên của giáo viên khác.`);
        return;
      }
    }

    // If assigning to a new class, ensure it belongs to the current admin
    const targetClass = classes.find((c) => c.id === targetClassId);
    if (targetClass && !isClassOwner(targetClass)) {
      alert('⚠️ QUYỀN RIÊNG TƯ: Bạn chỉ có thể phân học viên vào lớp do chính mình phụ trách!');
      return;
    }

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              class_id: targetClassId || undefined,
              class_code: targetClass ? targetClass.class_code : undefined,
              current_level: targetClass ? targetClass.hsk_level : s.current_level,
              current_level_updated_at: new Date().toISOString(),
              current_level_updated_by: currentAdminEmail,
            }
          : s
      )
    );

    await updateStudentInFirestore(studentId, {
      class_id: targetClassId || undefined,
      class_code: targetClass ? targetClass.class_code : undefined,
      current_level: targetClass ? targetClass.hsk_level : undefined,
      current_level_updated_at: new Date().toISOString(),
      current_level_updated_by: currentAdminEmail,
    });
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    const st = students.find((s) => s.id === studentId);
    if (st && st.class_id) {
      const studentClass = classes.find((c) => c.id === st.class_id);
      if (studentClass && !isClassOwner(studentClass)) {
        alert(`⚠️ QUYỀN RIÊNG TƯ: Học viên "${studentName}" thuộc lớp của GV "${studentClass.teacher_name}". Bạn không thể xóa học viên của giáo viên khác!`);
        return;
      }
    }

    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn XÓA HOÀN TOÀN học viên "${studentName}" khỏi cơ sở dữ liệu? Dữ liệu tiến độ học tập và bài tập của học viên sẽ bị xóa vĩnh viễn.`
    );
    if (!confirmDelete) return;

    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    await deleteStudentInFirestore(studentId);
    alert(`Đã xóa thành công học viên ${studentName} khỏi cơ sở dữ liệu hệ thống.`);
  };

  const handleGraduateStudent = async (studentId: string, studentName: string) => {
    const st = students.find((s) => s.id === studentId);
    if (st && st.class_id) {
      const studentClass = classes.find((c) => c.id === st.class_id);
      if (studentClass && !isClassOwner(studentClass)) {
        alert(`⚠️ QUYỀN RIÊNG TƯ: Học viên "${studentName}" thuộc lớp của GV khác. Bạn không thể can thiệp!`);
        return;
      }
    }

    const confirmGrad = window.confirm(
      `Xác nhận học viên "${studentName}" đã HOÀN THÀNH KHÓA HỌC và TỐT NGHIỆP? Học viên sẽ được gỡ khỏi lớp học hiện tại.`
    );
    if (!confirmGrad) return;

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              class_id: undefined,
              class_code: undefined,
            }
          : s
      )
    );
    await updateStudentInFirestore(studentId, {
      class_id: undefined,
      class_code: undefined,
    });
    alert(`Chúc mừng! Học viên ${studentName} đã được đánh dấu hoàn thành khóa học.`);
  };

  const handleGenerateAIQuizForModal = async () => {
    setIsGeneratingQuizAI(true);
    try {
      const selectedClass = classes.find((c) => c.id === newAssignTargetClass);
      const effectiveHsk = newAssignTargetType === 'class' && selectedClass ? selectedClass.hsk_level : newAssignLevel;
      const byokKey = localStorage.getItem('minnese_gemini_api_key') || localStorage.getItem('gemini_api_key') || '';
      const res = await fetch('/api/gemini/generate-quiz', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(byokKey ? { 'x-byok-gemini-key': byokKey } : {}),
        },
        body: JSON.stringify({
          topic: aiQuizTopic || 'Kiến thức trọng tâm HSK',
          hskLevel: effectiveHsk,
          count: aiQuizCount,
          apiKey: byokKey,
        }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setGeneratedQuizQuestions(data.questions);
        if (!newAssignTitle) {
          setNewAssignTitle(`[Trắc nghiệm] Ôn tập ${aiQuizTopic || 'HSK'} (HSK ${effectiveHsk})`);
        }
        if (!newAssignDesc) {
          setNewAssignDesc(`Hoàn thành ${data.questions.length} câu hỏi trắc nghiệm củng cố kiến thức.`);
        }
      }
    } catch (err) {
      console.error('Error generating AI quiz:', err);
    } finally {
      setIsGeneratingQuizAI(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignTitle.trim()) return;

    const selectedClass = classes.find((c) => c.id === newAssignTargetClass);
    if (newAssignTargetType === 'class' && selectedClass && !isClassOwner(selectedClass)) {
      alert('⚠️ QUYỀN RIÊNG TƯ: Bạn chỉ có thể giao bài tập cho Lớp học do chính bạn quản lý!');
      return;
    }

    const effectiveHsk = newAssignTargetType === 'class' && selectedClass ? selectedClass.hsk_level : newAssignLevel;

    let contentRefId = `ref-${Date.now()}`;
    let contentTitle = newAssignTitle.trim();
    let examCode = '';
    let questionCount = 0;
    let durationMinutes = 15;
    let questionsToAttach: QuizQuestion[] | undefined = undefined;
    let vocabWords: string[] | undefined = undefined;

    if (newAssignType === 'quiz') {
      if (quizSourceType === 'existing_exam') {
        const foundExam = onlineExams.find((e) => e.id === selectedExamId);
        if (foundExam) {
          contentRefId = foundExam.id;
          contentTitle = foundExam.title;
          examCode = foundExam.exam_code;
          questionCount = foundExam.questions?.length || 0;
          durationMinutes = foundExam.duration_minutes || 15;
          questionsToAttach = foundExam.questions;
        }
      } else {
        // AI generated or standard questions
        const generatedCode = `EXAM-${Math.floor(1000 + Math.random() * 9000)}`;
        examCode = generatedCode;

        let qList = generatedQuizQuestions;
        if (!qList || qList.length === 0) {
          try {
            const res = await fetch('/api/gemini/generate-quiz', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                topic: aiQuizTopic || 'Kiến thức trọng tâm HSK',
                hskLevel: effectiveHsk,
                count: aiQuizCount || 10,
              }),
            });
            const data = await res.json();
            if (data.questions && data.questions.length > 0) {
              qList = data.questions;
            }
          } catch (err) {
            console.warn('Error fetching quiz for assignment, using fallbacks', err);
          }
        }

        questionCount = qList?.length || 10;
        durationMinutes = Math.max(10, questionCount * 1.5);
        questionsToAttach = qList;

        // Also create a real OnlineExamDoc so it's fully compatible with the exam runner
        const newExamDoc: OnlineExamDoc = {
          id: `exam-${Date.now()}`,
          exam_code: generatedCode,
          title: newAssignTitle.trim(),
          description: newAssignDesc.trim() || `Bài kiểm tra ${questionCount} câu HSK ${effectiveHsk}`,
          hsk_level: (effectiveHsk as HSKLevel) || 1,
          duration_minutes: durationMinutes,
          target_class_id: newAssignTargetType === 'class' ? newAssignTargetClass : undefined,
          target_type: newAssignTargetType,
          questions: qList || [],
          total_points: (qList?.length || 10) * 10,
          remix_mode: 'comprehensive',
          created_by: currentAdminEmail,
          created_at: new Date().toISOString(),
          is_active: true,
        };

        contentRefId = newExamDoc.id;
        contentTitle = newExamDoc.title;
        setOnlineExams((prev) => [newExamDoc, ...prev]);
        await saveOnlineExamToFirestore(newExamDoc);
      }
    } else if (newAssignType === 'deck') {
      const vocabPool = vocabList.filter((v) => v.hskLevel === effectiveHsk);
      vocabWords = (vocabPool.length > 0 ? vocabPool : vocabList).slice(0, deckWordCount).map((v) => v.hanzi);
      contentTitle = `Bộ thẻ ${deckWordCount} từ vựng HSK ${effectiveHsk} (${deckTopic || 'Cốt lõi'})`;
    } else if (newAssignType === 'reading') {
      contentTitle = `Bài đọc hiểu HSK ${effectiveHsk}: ${readingTopic}`;
    } else if (newAssignType === 'writing') {
      contentTitle = `Luyện viết chữ Hán OCR: ${newAssignTitle.trim()}`;
    }

    let finalDueDateIso = '';
    if (newAssignDueDate) {
      finalDueDateIso = new Date(newAssignDueDate).toISOString();
    } else {
      const d = new Date(Date.now() + 3 * 86400000);
      d.setHours(23, 59, 0, 0);
      finalDueDateIso = d.toISOString();
    }

    const newAssign: AssignmentDoc = {
      id: `assign-${Date.now()}`,
      title: newAssignTitle.trim(),
      description: newAssignDesc.trim(),
      target_type: newAssignTargetType,
      target_class_id: newAssignTargetType === 'class' ? newAssignTargetClass : undefined,
      hsk_level: effectiveHsk,
      content_type: newAssignType,
      content_ref_id: contentRefId,
      content_title: contentTitle,
      exam_code: examCode || undefined,
      question_count: questionCount || undefined,
      duration_minutes: durationMinutes || undefined,
      questions: questionsToAttach,
      vocab_words: vocabWords,
      reading_topic: newAssignType === 'reading' ? readingTopic : undefined,
      writing_prompt: newAssignType === 'writing' ? writingPrompt : undefined,
      due_date: finalDueDateIso,
      created_by: currentAdminEmail,
      created_at: new Date().toISOString(),
      is_active: true,
    };

    setAssignments([newAssign, ...assignments]);
    setShowAddAssignModal(false);
    setNewAssignTitle('');
    setNewAssignDesc('');
    setNewAssignDueDate('');
    setGeneratedQuizQuestions([]);
    setSelectedZaloAssignment(newAssign);

    await saveAssignmentToFirestore(newAssign);

    setSeedToast({
      success: true,
      message: `✨ Đã tạo bài tập "${newAssign.title}" thành công! Cửa sổ thông báo Zalo đã được mở sẵn để bạn gửi cho lớp.`,
    });
    setTimeout(() => setSeedToast(null), 6000);
  };

  const handleDeleteAssignment = async (assignId: string, title: string) => {
    const asg = assignments.find((a) => a.id === assignId);
    if (!asg) return;

    if (!isAssignmentOwner(asg)) {
      alert('⚠️ QUYỀN RIÊNG TƯ: Bạn không thể xóa bài tập do Giáo viên khác giao!');
      return;
    }

    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa bài tập "${title}"?`);
    if (!confirmDelete) return;

    setAssignments((prev) => prev.filter((a) => a.id !== assignId));
    await deleteAssignmentInFirestore(assignId);
    alert(`Đã xóa bài tập "${title}".`);
  };

  const handleSaveGrading = async () => {
    if (!selectedSubmissionForDetail) return;
    setIsSavingGrading(true);
    try {
      const updatedSub: AssignmentSubmissionDoc = {
        ...selectedSubmissionForDetail,
        score: manualScore,
        feedback: manualFeedback,
        teacher_voice_url: manualVoiceUrl || undefined,
        teacher_voice_duration: manualVoiceDuration || undefined,
        pronunciation_notes: manualPronunciationNotes.length > 0 ? manualPronunciationNotes : undefined,
        teacher_name: currentAdmin?.displayName || 'Giáo viên Minnese Chinese',
      };

      const success = await saveSubmissionToFirestore(updatedSub);
      if (success) {
        setSubmissions((prev) => prev.map((s) => s.id === updatedSub.id ? updatedSub : s));
        setSelectedSubmissionForDetail(updatedSub);
        alert('Đã cập nhật điểm số, nhận xét và Voice chữa phát âm thành công!');
      } else {
        alert('Lỗi: Không thể lưu điểm số vào cơ sở dữ liệu Firestore.');
      }
    } catch (err) {
      console.error('Error saving manual grade:', err);
      alert('Đã xảy ra lỗi khi lưu kết quả chấm điểm.');
    } finally {
      setIsSavingGrading(false);
    }
  };

  const filteredVocab = vocabList.filter((item) => {
    const q = vocabSearch.trim().toLowerCase();
    const matchLevel = vocabLevelFilter === 'all' || item.hskLevel === vocabLevelFilter;
    if (!q) return matchLevel;

    const matchSearch =
      item.hanzi.toLowerCase().includes(q) ||
      item.pinyin.toLowerCase().includes(q) ||
      (item.vietnamese && item.vietnamese.toLowerCase().includes(q)) ||
      (item.hanViet && item.hanViet.toLowerCase().includes(q)) ||
      (item.english && item.english.toLowerCase().includes(q));

    return matchSearch && matchLevel;
  });

  const totalPages = Math.ceil(filteredVocab.length / VOCAB_PER_PAGE) || 1;
  const paginatedVocab = filteredVocab.slice(
    (vocabPage - 1) * VOCAB_PER_PAGE,
    vocabPage * VOCAB_PER_PAGE
  );

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6" id="admin-panel-container">
      {/* Clean, Focused Admin Header */}
      <div className="bg-[var(--color-surface)] px-5 py-4 rounded-2xl border border-[var(--color-border)] silk-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
                Quản trị Lớp học & Bài tập
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                Phụ trách {myClasses.length} lớp
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Giáo viên: <strong className="text-[var(--color-text-primary)]">{currentAdminName}</strong> ({currentAdminEmail})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isLoadingData}
            onClick={loadRealData}
            className="px-3 py-2 rounded-xl bg-[var(--color-background)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Đồng bộ lại toàn bộ dữ liệu thực tế từ Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-[var(--color-primary)]' : ''}`} />
            <span>{isLoadingData ? 'Đang tải...' : 'Đồng bộ'}</span>
          </button>

          <button
            type="button"
            disabled={seedLoading}
            onClick={handleSeedData}
            className="px-3 py-2 rounded-xl bg-[var(--color-background)] hover:bg-amber-500/10 border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-amber-600 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Khởi tạo dữ liệu mẫu demo nếu hệ thống trống"
          >
            <RefreshCw className={`w-3 h-3 ${seedLoading ? 'animate-spin' : ''}`} />
            <span>{seedLoading ? 'Đang nạp...' : 'Seed mẫu'}</span>
          </button>
        </div>
      </div>

      {/* Seed Notification Toast */}
      {seedToast && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
            seedToast.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-500'
          }`}
        >
          <div className="flex items-center gap-2">
            {seedToast.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{seedToast.message}</span>
          </div>
          <button onClick={() => setSeedToast(null)} className="text-xs font-bold hover:underline">
            Đóng
          </button>
        </div>
      )}

      {/* Primary Streamlined Navigation Tabs */}
      <div className="bg-[var(--color-surface)] p-2 rounded-2xl border border-[var(--color-border)] shadow-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'classes'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Lớp học ({myClasses.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Học viên</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('assignments')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'assignments'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Giao bài tập</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('admins')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'admins'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Phân quyền</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvancedTools((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              showAdvancedTools || ['workbooks', 'vocab', 'rag', 'prompts', 'tester'].includes(activeTab)
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
                : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Công cụ AI & Giáo trình</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedTools || ['workbooks', 'vocab', 'rag', 'prompts', 'tester'].includes(activeTab) ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {(showAdvancedTools || ['workbooks', 'vocab', 'rag', 'prompts', 'tester'].includes(activeTab)) && (
          <div className="pt-2 border-t border-[var(--color-border)] flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('workbooks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'workbooks'
                  ? 'bg-purple-600 text-white shadow-xs font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-purple-600 hover:bg-[var(--color-background)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sách Bài Tập & Trộn Đề AI</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vocab')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'vocab'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Từ vựng HSK</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rag')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'rag'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
              }`}
            >
              <FolderSearch className="w-3.5 h-3.5" />
              <span>Kho tài liệu RAG</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('prompts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'prompts'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Prompt Templates</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tester')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'tester'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kiểm tra RAG</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 0: CLASSES MANAGEMENT */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Danh sách Lớp học ({classes.length})
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Mỗi lớp có mã tham gia ngẫu nhiên riêng (vd: <code className="font-bold text-[var(--color-primary)]">HSK1-A7X2</code>). Học viên nhập mã để vào lớp.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Tabs for Privacy */}
              <div className="flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setClassScope('my_classes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    classScope === 'my_classes'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Lớp của tôi ({myClasses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setClassScope('all_classes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    classScope === 'all_classes'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Tất cả ({classes.length})
                </button>
              </div>

              <button
                onClick={() => setShowAddClassModal(true)}
                className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Lớp Mới</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedClasses.map((c) => {
              const isOwner = isClassOwner(c);
              const classMembers = students.filter(
                (s) => s.class_id === c.id || s.class_code === c.class_code
              );
              const actualStudentCount = classMembers.length;
              return (
                <div
                  key={c.id}
                  className={`bg-[var(--color-surface)] p-5 rounded-2xl border space-y-4 shadow-xs transition-all ${
                    isOwner
                      ? 'border-[var(--color-primary)]/40 ring-1 ring-[var(--color-primary)]/10'
                      : 'border-[var(--color-border)] opacity-90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                          HSK {c.hsk_level}
                        </span>
                        {isOwner ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Lớp của bạn
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Lớp của GV khác
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-base text-[var(--color-text-primary)] mt-1.5">{c.class_name}</h3>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Giáo viên: <strong className="text-[var(--color-text-primary)]">{c.teacher_name}</strong>
                      </p>
                      <p className="text-[10px] text-[var(--color-text-secondary)] font-mono">
                        Tạo bởi: {c.created_by || 'admin'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => isOwner && handleToggleClassActive(c.id)}
                      disabled={!isOwner}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                        !isOwner
                          ? 'opacity-60 cursor-not-allowed'
                          : 'cursor-pointer hover:opacity-80'
                      } ${
                        c.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-500'
                      }`}
                      title={isOwner ? 'Nhấp để Đóng/Mở lớp' : 'Bạn không có quyền thay đổi trạng thái lớp này'}
                    >
                      {c.is_active ? 'Đang mở' : 'Đã đóng'}
                    </button>
                  </div>

                  {/* Class Code Highlight */}
                  <div className="p-3 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-semibold">Mã Lớp Học:</span>
                      <p className="font-mono font-extrabold text-base text-[var(--color-primary)] tracking-wide">{c.class_code}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(c.class_code);
                          alert(`Đã sao chép mã lớp: ${c.class_code}`);
                        }}
                        className="p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                        title="Sao chép mã lớp"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRegenerateCode(c.id, c.hsk_level)}
                        disabled={!isOwner}
                        className={`p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] ${
                          isOwner
                            ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer'
                            : 'opacity-40 cursor-not-allowed text-gray-400'
                        }`}
                        title={isOwner ? 'Tạo lại mã lớp ngẫu nhiên' : 'Chỉ giáo viên phụ trách mới có quyền đổi mã lớp này'}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleDeleteClass(c.id, c.class_name)}
                          className="p-2 rounded-lg bg-[var(--color-surface)] border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                          title="Xóa lớp học này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] pt-1 border-t border-[var(--color-border)]">
                    <span>
                      Sĩ số:{' '}
                      <strong className="text-[var(--color-text-primary)]">
                        {actualStudentCount} học viên
                      </strong>
                    </span>
                    <span>Ngày tạo: {c.created_at}</span>
                  </div>

                  {isOwner || isSuperAdmin ? (
                    <button
                      type="button"
                      onClick={() => setInspectingClass(c)}
                      className="w-full py-2 px-3 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem học viên & tiến độ ({actualStudentCount})</span>
                    </button>
                  ) : (
                    <div
                      className="w-full py-2 px-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-[11px] font-medium flex items-center justify-center gap-1.5 opacity-80 select-none"
                      title="Admin cấp dưới chỉ xem được sĩ số lớp khác, không xem được thông tin chi tiết học viên"
                    >
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>Chỉ xem sĩ số • Khóa chi tiết học viên</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {displayedClasses.length === 0 && (
            <div className="p-8 text-center bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] space-y-2">
              <GraduationCap className="w-8 h-8 text-[var(--color-text-secondary)] mx-auto opacity-40" />
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {classScope === 'my_classes'
                  ? 'Bạn chưa tạo lớp học nào do chính mình quản lý.'
                  : 'Chưa có lớp học nào trong hệ thống.'}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Nhấn &quot;Tạo Lớp Mới&quot; ở trên để bắt đầu tạo lớp và cấp mã lớp riêng cho học viên của bạn.
              </p>
            </div>
          )}

          {/* Modal Tạo Lớp Mới */}
          {showAddClassModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Tạo Lớp Học Riêng Mới</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Lớp sẽ được gán tự động cho bạn (<span className="font-semibold text-[var(--color-primary)]">{currentAdminEmail}</span>)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddClassModal(false)}
                    className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-background)]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateClass} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                      Tên Lớp Học
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: HSK 1 - Lớp tối 2-4-6 Thầy Minh"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                        Trình độ HSK
                      </label>
                      <select
                        value={newClassLevel}
                        onChange={(e) => setNewClassLevel(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                      >
                        {[1, 2, 3, 4, 5, 6].map((lvl) => (
                          <option key={lvl} value={lvl}>
                            HSK {lvl}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                        Tên hiển thị Giáo viên
                      </label>
                      <input
                        type="text"
                        value={newClassTeacher}
                        onChange={(e) => setNewClassTeacher(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddClassModal(false)}
                      className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold hover:bg-[var(--color-background)] cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] cursor-pointer"
                    >
                      Tạo Lớp & Sinh Mã
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: STUDENTS MANAGEMENT */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  Học viên thuộc quyền quản lý ({displayedStudents.length})
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  ● Bảo mật theo lớp
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Chỉ hiển thị học viên trong các lớp bạn giảng dạy và học viên tự do chưa vào lớp.
              </p>
            </div>

            {/* Student Filter Tabs for Privacy */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setStudentFilter('my_students')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    studentFilter === 'my_students'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Lớp của tôi ({students.filter((s) => (s.class_id && myClassIdSet.has(s.class_id)) || (s.class_code && myClassCodeSet.has(s.class_code))).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStudentFilter('unassigned')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    studentFilter === 'unassigned'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Học tự do ({students.filter((s) => !s.class_id && !s.class_code).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStudentFilter('all_students')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    studentFilter === 'all_students'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Lớp tôi & Tự do ({students.filter((s) => (s.class_id && myClassIdSet.has(s.class_id)) || (s.class_code && myClassCodeSet.has(s.class_code)) || (!s.class_id && !s.class_code)).length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('admins')}
                className="px-3.5 py-1.5 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] text-xs font-bold hover:bg-[var(--color-primary)] hover:text-white transition-all flex items-center gap-1.5 border border-[var(--color-primary)]/20 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>+ Cấp quyền Admin / GV</span>
              </button>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/50 text-[var(--color-text-secondary)]">
                    <th className="p-3.5 font-semibold">Tài khoản</th>
                    <th className="p-3.5 font-semibold">Vai trò (Role)</th>
                    <th className="p-3.5 font-semibold">Lớp hiện tại</th>
                    <th className="p-3.5 font-semibold">Trình độ HSK</th>
                    <th className="p-3.5 font-semibold">Streak & EXP</th>
                    <th className="p-3.5 font-semibold">Quyền can thiệp & Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {displayedStudents.map((st) => {
                    const studentClass = st.class_id ? classes.find((c) => c.id === st.class_id) : undefined;
                    const isMyStudent = !st.class_id || (studentClass ? isClassOwner(studentClass) : true);

                    return (
                      <tr
                        key={st.id}
                        className={`transition-colors ${
                          isMyStudent
                            ? 'hover:bg-[var(--color-background)]/40'
                            : 'bg-gray-500/5 hover:bg-gray-500/10'
                        }`}
                      >
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[var(--color-text-primary)]">{st.displayName}</span>
                          </div>
                          <div className="text-[11px] text-[var(--color-text-secondary)] font-mono">{st.email}</div>
                        </td>

                        <td className="p-3.5">
                          <select
                            value={st.role || 'user'}
                            onChange={(e) => handleUpdateStudentRole(st.id, e.target.value as any, st.email)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                              st.role === 'admin'
                                ? 'bg-purple-500/10 text-purple-600 border-purple-500/30'
                                : st.role === 'teacher'
                                ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                                : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border)]'
                            }`}
                          >
                            <option value="user">Học viên (User)</option>
                            <option value="teacher">Giáo viên (Teacher)</option>
                            <option value="admin">Quản trị viên (Admin)</option>
                          </select>
                        </td>

                        <td className="p-3.5">
                          {isMyStudent ? (
                            <select
                              value={st.class_id || ''}
                              onChange={(e) => handleUpdateStudentClass(st.id, e.target.value)}
                              className="px-2.5 py-1 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-semibold focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
                            >
                              <option value="">(Học tự do)</option>
                              {myClasses.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                  {cls.class_name} ({cls.class_code})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                              <Lock className="w-3.5 h-3.5 shrink-0" />
                              <span>{studentClass ? studentClass.class_name : 'Lớp của GV khác'}</span>
                            </div>
                          )}
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold px-2.5 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                              HSK {st.current_level}
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--color-primary)] font-bold">{st.exp_points || 0} XP</span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          {isMyStudent ? (
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5, 6].map((lvl) => (
                                  <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => handleUpdateStudentLevel(st.id, lvl)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                      st.current_level === lvl
                                        ? 'bg-[var(--color-primary)] text-white'
                                        : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                                    }`}
                                    title={`Gán học viên lên HSK ${lvl}`}
                                  >
                                    H{lvl}
                                  </button>
                                ))}
                              </div>

                              <div className="flex items-center gap-1.5 border-l border-[var(--color-border)] pl-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedStudentForDetail(st)}
                                  className="px-2 py-1 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  title="Xem biểu đồ và hồ sơ chi tiết tiến độ học tập"
                                >
                                  <BarChart3 className="w-3 h-3" />
                                  <span>Tiến độ</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleGraduateStudent(st.id, st.displayName)}
                                  className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Đánh dấu học viên đã hoàn thành khóa học & tốt nghiệp"
                                >
                                  🎓 Tốt nghiệp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStudent(st.id, st.displayName)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Xóa hoàn toàn học viên khỏi hệ thống DB"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-[var(--color-text-secondary)] italic flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-500" />
                              <span>Thuộc lớp riêng của GV {studentClass?.teacher_name || 'khác'} (Chỉ xem)</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {displayedStudents.length === 0 && (
              <div className="p-8 text-center space-y-2">
                <Users className="w-8 h-8 text-[var(--color-text-secondary)] mx-auto opacity-40" />
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Không có học viên nào trong mục này.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: ADMINS & ROLE MANAGEMENT & HANDOVER */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          {/* Handover Notice Card */}
          <div className="bg-gradient-to-r from-[var(--color-primary-light)] to-emerald-500/10 p-5 rounded-2xl border border-[var(--color-primary)]/30 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  Quản lý Phân quyền & Bàn giao Hệ thống (Không cần sửa Source Code)
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Tính năng này giúp bạn dễ dàng bàn giao website cho khách hàng hoặc đối tác không biết lập trình.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs text-[var(--color-text-secondary)]">
              <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] space-y-1">
                <span className="font-bold text-[var(--color-primary)]">Bước 1: Nhập Email</span>
                <p>Nhập email của khách hàng hoặc giáo viên mới vào biểu mẫu bên dưới.</p>
              </div>
              <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] space-y-1">
                <span className="font-bold text-[var(--color-primary)]">Bước 2: Chọn Vai trò & Cấp quyền</span>
                <p>Chọn <strong>Quản trị viên (Admin)</strong> để cấp toàn quyền hoặc <strong>Giáo viên (Teacher)</strong>.</p>
              </div>
              <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] space-y-1">
                <span className="font-bold text-[var(--color-primary)]">Bước 3: Khách hàng đăng nhập</span>
                <p>Khách hàng chỉ cần bấm Đăng nhập bằng email đó là vào thẳng trang Admin mà không cần sửa code.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Cấp quyền Admin / Teacher mới */}
            <div className="lg:col-span-1 bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] space-y-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  Cấp quyền Quản trị / Giáo viên mới
                </h3>
              </div>

              <form onSubmit={handleAddNewAdminOrTeacher} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Địa chỉ Email của khách hàng / giáo viên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="vd: khachhang@gmail.com"
                    value={newAdminEmailInput}
                    onChange={(e) => setNewAdminEmailInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Vai trò cần cấp <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newAdminRoleInput}
                    onChange={(e) => setNewAdminRoleInput(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
                  >
                    <option value="admin">👑 Quản trị viên (Admin - Toàn quyền quản trị)</option>
                    <option value="teacher">👨‍🏫 Giáo viên (Teacher - Quản lý lớp & giao bài)</option>
                  </select>
                </div>

                <div className="p-3 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] text-[11px] text-[var(--color-text-secondary)] space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-[var(--color-text-primary)]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lưu tức thì vào Firestore Database</span>
                  </div>
                  <p>
                    Quyền được đồng bộ thời gian thực. Bất kỳ ai sở hữu email này khi đăng nhập đều được hệ thống tự động nhận diện.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAdmin || !newAdminEmailInput.trim()}
                  className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmittingAdmin ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>{isSubmittingAdmin ? 'Đang lưu...' : 'Cấp quyền ngay'}</span>
                </button>
              </form>
            </div>

            {/* Danh sách Quản trị viên hiện tại */}
            <div className="lg:col-span-2 bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <span>Danh sách Quản trị viên đang có quyền ({dynamicAdmins.length})</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                      Firestore Synced
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Những email dưới đây có quyền truy cập toàn bộ Bảng điều khiển Quản trị.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] overflow-hidden">
                {dynamicAdmins.map((adminEmail, idx) => {
                  const isPrimaryOwner = adminEmail.toLowerCase() === 'babysharkkk123@gmail.com';
                  const userProfile = students.find((s) => (s.email || '').toLowerCase() === adminEmail.toLowerCase());

                  return (
                    <div
                      key={idx}
                      className="p-3.5 bg-[var(--color-background)]/30 hover:bg-[var(--color-background)]/70 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                          👑
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--color-text-primary)]">
                              {userProfile?.displayName || adminEmail.split('@')[0]}
                            </span>
                            {isPrimaryOwner ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                                🌟 Admin Cấp Cao (Chủ sở hữu)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                                Admin cấp dưới (Chỉ xem sĩ số lớp khác)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--color-text-secondary)] font-mono">
                            {adminEmail}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPrimaryOwner ? (
                          <span className="text-[11px] text-[var(--color-text-secondary)] italic flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-500" />
                            Được bảo vệ
                          </span>
                        ) : !isSuperAdmin ? (
                          <span className="text-[11px] text-[var(--color-text-secondary)] italic flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Chỉ Admin cấp cao gỡ quyền
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRevokeAdminAccess(adminEmail)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Thu hồi quyền Admin của tài khoản này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Thu hồi Admin</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGNMENTS & HOMEWORK */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <span>Quản lý Bài tập được giao ({displayedAssignments.length})</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ⏰ Tự động xóa khi quá hạn
                </span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Bài tập phân theo mã lớp cụ thể hoặc cấp HSK chung. Khi quá giờ deadline, bài tập và đề thi sẽ tự động xóa vĩnh viễn khỏi hệ thống.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAssignmentScope('my_assignments')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    assignmentScope === 'my_assignments'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Bài tập của tôi ({displayedAssignments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAssignmentScope('all_assignments')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    assignmentScope === 'all_assignments'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Tất cả ({assignments.length})
                </button>
              </div>

              <button
                onClick={() => {
                  if (!newAssignDueDate) {
                    setNewAssignDueDate(getDefaultDueDateTimeString());
                  }
                  setShowAddAssignModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Giao Bài Tập Mới</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedAssignments.map((asg) => {
              const targetClass = classes.find((c) => c.id === asg.target_class_id);
              const isOwner = isAssignmentOwner(asg);
              const due = new Date(asg.due_date);
              const dueFormatted = `${due.toLocaleDateString('vi-VN')} ${due.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
              const timeLeftMs = due.getTime() - Date.now();
              const hoursLeft = Math.max(0, Math.floor(timeLeftMs / 3600000));
              const daysLeft = Math.floor(hoursLeft / 24);

              return (
                <div
                  key={asg.id}
                  className={`bg-[var(--color-surface)] p-5 rounded-2xl border space-y-3.5 shadow-xs transition-all ${
                    isOwner
                      ? 'border-[var(--color-primary)]/30'
                      : 'border-[var(--color-border)] opacity-85'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {asg.target_type === 'class' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            Lớp: {targetClass ? targetClass.class_name : asg.target_class_id}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                            Cả khối HSK {asg.hsk_level}
                          </span>
                        )}
                        <span className="text-[10px] uppercase font-semibold text-[var(--color-text-secondary)]">
                          {asg.content_type === 'quiz'
                            ? '🎯 Trắc nghiệm & Đề thi'
                            : asg.content_type === 'deck'
                            ? '🗂️ Bộ Flashcard'
                            : asg.content_type === 'reading'
                            ? '📖 Đọc hiểu HSK'
                            : '✍️ Viết tay OCR'}
                        </span>
                        {isOwner ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Của bạn
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-gray-500/10 text-gray-500 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            {asg.created_by || 'GV khác'}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-[var(--color-text-primary)]">{asg.title}</h3>
                    </div>
                    <span className="text-[11px] font-bold text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-500" />
                      <span>Hạn: {dueFormatted}</span>
                      <span className="opacity-80">({hoursLeft > 24 ? `còn ${daysLeft} ngày` : hoursLeft > 0 ? `còn ${hoursLeft} giờ` : 'Sắp xóa'})</span>
                    </span>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)]">{asg.description}</p>

                  {/* Attached Content Details Box */}
                  <div className="p-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      {asg.content_type === 'quiz' && (
                        <>
                          <span className="font-medium text-[var(--color-primary)] flex items-center gap-1">
                            📝 {asg.question_count || (asg.questions ? asg.questions.length : 10)} câu hỏi ({asg.duration_minutes || 15} phút)
                          </span>
                          {asg.exam_code && (
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              Mã thi: {asg.exam_code}
                            </span>
                          )}
                        </>
                      )}
                      {asg.content_type === 'deck' && (
                        <span className="font-medium text-emerald-600">
                          🗂️ {asg.vocab_words?.length || 15} từ vựng cốt lõi HSK {asg.hsk_level}
                        </span>
                      )}
                      {asg.content_type === 'reading' && (
                        <span className="font-medium text-blue-600">
                          📖 Chủ đề: {asg.reading_topic || 'Bài đọc khóa'}
                        </span>
                      )}
                      {asg.content_type === 'writing' && (
                        <span className="font-medium text-purple-600">
                          ✍️ Bài viết chữ Hán OCR
                        </span>
                      )}
                    </div>

                    {(asg.questions && asg.questions.length > 0) || asg.vocab_words ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (asg.questions && asg.questions.length > 0) {
                            setPreviewExamDetail({
                              title: asg.title,
                              questions: asg.questions,
                              code: asg.exam_code,
                            });
                          } else if (asg.vocab_words) {
                            setViewingAssignmentDetail(asg);
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-[11px] font-semibold text-[var(--color-text-primary)] flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Eye className="w-3 h-3 text-[var(--color-primary)]" />
                        <span>Xem nội dung đính kèm</span>
                      </button>
                    ) : null}
                  </div>

                  <div className="pt-2 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const asgSubmissions = submissions.filter((s) => s.assignment_id === asg.id);
                        return (
                          <span className="font-medium text-[var(--color-text-primary)]">
                            Đã nộp: <strong className="text-[var(--color-primary)]">{asgSubmissions.length}</strong> bài làm
                          </span>
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSelectedAsgForSubmissions(asg)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                        title="Xem danh sách bài làm và chấm điểm chữ viết tay tự luận"
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Xem Bài Nộp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedZaloAssignment(asg)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                        title="Soạn tin nhắn gửi vào nhóm Zalo hoặc nhắc riêng từng học viên"
                      >
                        <span>📱 Zalo</span>
                      </button>

                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAssignment(asg.id, asg.title)}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="Xóa bài tập này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {displayedAssignments.length === 0 && (
            <div className="p-8 text-center bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] space-y-2">
              <FileText className="w-8 h-8 text-[var(--color-text-secondary)] mx-auto opacity-40" />
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Chưa có bài tập nào trong mục này.
              </p>
            </div>
          )}

          {/* Modal Gửi thông báo Zalo */}
          {selectedZaloAssignment && (
            <ZaloNotificationModal
              assignment={selectedZaloAssignment}
              classes={classes}
              students={students}
              onClose={() => setSelectedZaloAssignment(null)}
            />
          )}

          {/* Modal Xem Trước Câu Hỏi Đề Bài */}
          {previewExamDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl">
                <div className="flex items-start justify-between pb-4 border-b border-[var(--color-border)]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                        {previewExamDetail.title}
                      </h3>
                      {previewExamDetail.code && (
                        <span className="px-2 py-0.5 text-xs font-mono font-bold bg-amber-500/10 text-amber-600 rounded">
                          {previewExamDetail.code}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Danh sách {previewExamDetail.questions.length} câu hỏi đính kèm
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewExamDetail(null)}
                    className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
                  {previewExamDetail.questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-[var(--color-primary)]">
                          Câu {idx + 1}:
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[var(--color-surface)] border border-[var(--color-border)]">
                          {q.type}
                        </span>
                      </div>
                      <p className="font-semibold text-[var(--color-text-primary)] text-sm">
                        {q.prompt}
                      </p>
                      {q.questionChinese && (
                        <div className="p-2 rounded bg-[var(--color-surface)] font-serif text-base text-[var(--color-text-primary)]">
                          {q.questionChinese}
                        </div>
                      )}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = opt === q.correctAnswer;
                            return (
                              <div
                                key={oIdx}
                                className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20'
                                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                                }`}
                              >
                                {isCorrect ? <Check className="w-3.5 h-3.5" /> : <span className="opacity-50">•</span>}
                                <span>{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {q.explanation && (
                        <p className="text-[11px] text-[var(--color-text-secondary)] italic pt-1 border-t border-[var(--color-border)]/50">
                          💡 Giải thích: {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[var(--color-border)] flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPreviewExamDetail(null)}
                    className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Xem Từ Vựng Flashcard Đã Giao */}
          {viewingAssignmentDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col p-6 shadow-2xl">
                <div className="flex items-start justify-between pb-3 border-b border-[var(--color-border)]">
                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                      {viewingAssignmentDetail.title}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Danh sách từ vựng được giao trong bộ thẻ này
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingAssignmentDetail(null)}
                    className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto py-4 flex-1">
                  <div className="flex flex-wrap gap-2">
                    {viewingAssignmentDetail.vocab_words?.map((word, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-text-primary)] font-serif"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--color-border)] flex justify-end">
                  <button
                    type="button"
                    onClick={() => setViewingAssignmentDetail(null)}
                    className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Giao Bài Tập Mới (4-Step AI Homework Wizard) */}
          <HomeworkWizardModal
            isOpen={showAddAssignModal}
            onClose={() => setShowAddAssignModal(false)}
            classes={classes}
            myClasses={myClasses}
            onlineExams={onlineExams}
            currentAdminEmail={currentAdminEmail}
            onSuccess={(newAssign) => {
              setAssignments((prev) => [newAssign, ...prev]);
              setShowAddAssignModal(false);
              setSelectedZaloAssignment(newAssign);
              setSeedToast({
                success: true,
                message: `✨ Đã tạo bài tập "${newAssign.title}" thành công! Cửa sổ thông báo Zalo đã được mở sẵn để bạn gửi cho lớp.`,
              });
              setTimeout(() => setSeedToast(null), 6000);
            }}
          />
        </div>
      )}

      {/* TAB: WORKBOOK STUDIO & AI EXAM REMIXER */}
      {activeTab === 'workbooks' && (
        <WorkbookStudio
          classes={classes}
          currentAdminEmail={currentAdminEmail}
          currentAdminName={currentAdminName}
        />
      )}

      {/* TAB 3: VOCABULARY BY LEVEL */}
      {activeTab === 'vocab' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                <input
                  type="text"
                  placeholder="Tìm Hán tự, Pinyin, nghĩa..."
                  value={vocabSearch}
                  onChange={(e) => {
                    setVocabSearch(e.target.value);
                    setVocabPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <select
                value={vocabLevelFilter}
                onChange={(e) => {
                  setVocabLevelFilter(e.target.value === 'all' ? 'all' : Number(e.target.value));
                  setVocabPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold focus:outline-none focus:border-[var(--color-primary)]"
              >
                <option value="all">Tất cả cấp độ</option>
                {[1, 2, 3, 4, 5, 6].map((l) => (
                  <option key={l} value={l}>
                    HSK {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddSingleModal}
                className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-background)] text-[var(--color-text-primary)] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>Thêm 1 từ nhanh</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="px-3.5 py-2 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Nạp Excel / PDF OCR</span>
              </button>
              <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                ({filteredVocab.length} từ)
              </span>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/50 text-[var(--color-text-secondary)]">
                    <th className="p-3 font-semibold">Chữ Hán</th>
                    <th className="p-3 font-semibold">Pinyin</th>
                    <th className="p-3 font-semibold">Hán Việt</th>
                    <th className="p-3 font-semibold">Nghĩa tiếng Việt</th>
                    <th className="p-3 font-semibold">Cấp HSK</th>
                    <th className="p-3 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {paginatedVocab.map((v) => (
                    <tr key={v.id} className="hover:bg-[var(--color-background)]/40 transition-colors">
                      <td className="p-3 font-chinese font-bold text-lg text-[var(--color-text-primary)]">
                        {v.hanzi}
                      </td>
                      <td className="p-3 text-[var(--color-primary)] font-mono">{v.pinyin}</td>
                      <td className="p-3 text-[var(--color-text-secondary)]">{v.hanViet || '-'}</td>
                      <td className="p-3 text-[var(--color-text-primary)] font-medium">
                        {v.vietnamese || v.english || '-'}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                          HSK {v.hskLevel}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(v)}
                            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors"
                            title="Chỉnh sửa từ vựng & đồng bộ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setWordToDelete(v)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                            title="Xóa từ vựng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedVocab.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-[var(--color-text-secondary)]">
                        Không tìm thấy từ vựng nào phù hợp với từ khóa "{vocabSearch}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-background)]/30 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                <span>
                  Hiển thị {(vocabPage - 1) * VOCAB_PER_PAGE + 1} -{' '}
                  {Math.min(vocabPage * VOCAB_PER_PAGE, filteredVocab.length)} trên tổng {filteredVocab.length} từ
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={vocabPage <= 1}
                    onClick={() => setVocabPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-30 hover:bg-[var(--color-background)]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    Trang {vocabPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={vocabPage >= totalPages}
                    onClick={() => setVocabPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-30 hover:bg-[var(--color-background)]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Thêm / Chỉnh sửa từ vựng */}
          {showAddSingleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    {editingWord ? `Sửa từ vựng: ${editingWord.hanzi}` : 'Thêm từ vựng mới'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddSingleModal(false)}
                    className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveWordForm} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                        Chữ Hán (Hanzi) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: 学习"
                        value={editFormHanzi}
                        onChange={(e) => setEditFormHanzi(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm font-chinese font-bold focus:outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                        Pinyin *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: xuéxí"
                        value={editFormPinyin}
                        onChange={(e) => setEditFormPinyin(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm font-mono focus:outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                        Hán Việt
                      </label>
                      <input
                        type="text"
                        placeholder="VD: học tập"
                        value={editFormHanViet}
                        onChange={(e) => setEditFormHanViet(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                        Cấp độ HSK
                      </label>
                      <select
                        value={editFormLevel}
                        onChange={(e) => setEditFormLevel(Number(e.target.value) as HSKLevel)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-semibold focus:outline-none focus:border-[var(--color-primary)]"
                      >
                        {[1, 2, 3, 4, 5, 6].map((l) => (
                          <option key={l} value={l}>
                            HSK {l}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                      Nghĩa tiếng Việt *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: học, học tập"
                      value={editFormVietnamese}
                      onChange={(e) => setEditFormVietnamese(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                      Câu ví dụ chữ Hán (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 我喜欢学习汉语。"
                      value={editFormExample}
                      onChange={(e) => setEditFormExample(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-chinese focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                      Dịch nghĩa câu ví dụ
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Tôi thích học tiếng Hán."
                      value={editFormExampleTranslation}
                      onChange={(e) => setEditFormExampleTranslation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                    <button
                      type="button"
                      onClick={() => setShowAddSingleModal(false)}
                      className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold hover:bg-[var(--color-background)]"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] shadow-xs"
                    >
                      {editingWord ? 'Lưu cập nhật & Đồng bộ' : 'Thêm từ vựng & Đồng bộ'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Xác nhận Xóa từ vựng */}
          {wordToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                      Xác nhận xóa từ vựng
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Xóa vĩnh viễn từ này khỏi hệ thống & Từ Điển.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] flex items-center gap-3">
                  <span className="font-chinese font-bold text-2xl text-[var(--color-text-primary)]">
                    {wordToDelete.hanzi}
                  </span>
                  <div className="text-xs">
                    <div className="font-mono text-[var(--color-primary)] font-semibold">{wordToDelete.pinyin}</div>
                    <div className="text-[var(--color-text-secondary)]">{wordToDelete.vietnamese || wordToDelete.english}</div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setWordToDelete(null)}
                    className="px-3.5 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold hover:bg-[var(--color-background)]"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 shadow-xs"
                  >
                    Xác nhận Xóa
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FILE SEARCH STORES */}
      {activeTab === 'rag' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  Kho Tài Liệu & Tri Thức RAG (File Search Stores)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {fileStores.length} Stores trong Firestore
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Quản lý các tài liệu giáo trình, từ vựng và ngữ pháp thực tế được lưu trữ trên Firestore & nạp vào Gemini RAG.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tải Lên Tài Liệu (PDF / Excel / Text)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fileStores.map((st) => (
              <div
                key={st.id}
                className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] space-y-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                      Store: {st.store_name}
                    </span>
                    <h3 className="font-bold text-sm text-[var(--color-text-primary)] mt-1.5">{st.display_name}</h3>
                    <p className="text-[10px] text-[var(--color-text-secondary)] font-mono mt-0.5">
                      Tạo ngày: {st.createdAt || 'N/A'} • HSK: {st.hsk_level ? `Cấp ${st.hsk_level}` : 'Tất cả'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                      Đã đồng bộ
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteFileStore(st.id, st.display_name)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Xóa kho tài liệu này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
                    Tài liệu đã index ({st.files_uploaded?.length || 0}):
                  </span>
                  <div className="space-y-1.5">
                    {st.files_uploaded && st.files_uploaded.length > 0 ? (
                      st.files_uploaded.map((f, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                            <span className="font-mono text-[var(--color-text-primary)] truncate">{f.file_name}</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold shrink-0">
                            {f.status || 'INDEXED'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[var(--color-text-secondary)] italic p-2 bg-[var(--color-background)] rounded-xl">
                        Chưa có file nào trong kho này.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {fileStores.length === 0 && (
            <div className="p-8 text-center bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] space-y-3">
              <FolderSearch className="w-10 h-10 text-[var(--color-text-secondary)] mx-auto opacity-40" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  Chưa có Kho tài liệu nào được tạo trong Firestore
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] max-w-md mx-auto">
                  Kho tài liệu (RAG Stores) là nơi lưu trữ giáo trình, ngữ pháp và đề cương thực tế để AI Tutor tra cứu chính xác khi giải đáp cho học viên.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Tải Lên Tài Liệu Đầu Tiên</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PROMPT TEMPLATES */}
      {activeTab === 'prompts' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              Quản lý Prompt Templates
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Cấu hình system prompt động và danh sách File Search Stores gắn vào tool file_search.
            </p>
          </div>

          <div className="space-y-4">
            {promptTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-[var(--color-primary)]" />
                    <span className="font-mono font-bold text-sm text-[var(--color-text-primary)]">{tpl.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                      v{tpl.version}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-500">Đang hoạt động</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1">
                    System Prompt:
                  </label>
                  <textarea
                    rows={3}
                    defaultValue={tpl.system_prompt}
                    className="w-full p-3 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] font-mono focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                  <span>Stores đính kèm: {tpl.target_store_names.join(', ')}</span>
                  <button className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-xs flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu thay đổi</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: RAG TESTER */}
      {activeTab === 'tester' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              RAG Query Tester (File Search Verification)
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Thử nghiệm truy vấn ngữ nghĩa trên bộ tài liệu HSK đã index để kiểm tra độ chính xác của trích dẫn.
            </p>
          </div>

          <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Nhập câu hỏi ngữ pháp hoặc từ vựng..."
                className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-[var(--color-primary)]"
              />
              <button
                onClick={() => setRetrievedResults(queryKnowledgeBase(testQuery, 3))}
                className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-all flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Truy vấn</span>
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Kết quả trích xuất RAG ({retrievedResults.length} đoạn):
              </span>
              {retrievedResults.map((doc, idx) => (
                <div
                  key={doc.id || idx}
                  className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--color-primary)]">{doc.title}</span>
                    <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">
                      Thể loại: {doc.category} • HSK {doc.hskLevel}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{doc.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SMART DOCUMENT & VOCABULARY UPLOAD MODAL */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onImportWords={handleImportWords}
        onUploadRagFile={handleUploadRagFile}
      />

      {/* MODAL: XEM TIẾN ĐỘ HỌC VIÊN TỪNG LỚP HỌC (INSPECTING CLASS - OWNER OR SUPER ADMIN) */}
      {inspectingClass && (isClassOwner(inspectingClass) || isSuperAdmin) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[var(--color-border)] bg-[var(--color-background)]/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                      {inspectingClass.class_name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                      HSK {inspectingClass.hsk_level}
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-primary)] font-bold">
                      Mã: {inspectingClass.class_code}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Giáo viên: <strong>{inspectingClass.teacher_name}</strong> • Sĩ số:{' '}
                    <strong>
                      {students.filter((s) => s.class_id === inspectingClass.id || s.class_code === inspectingClass.class_code).length} học viên
                    </strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingClass(null)}
                className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {(() => {
                const classStudents = students.filter(
                  (s) => s.class_id === inspectingClass.id || s.class_code === inspectingClass.class_code
                );

                if (classStudents.length === 0) {
                  return (
                    <div className="p-8 text-center bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] space-y-2">
                      <Users className="w-8 h-8 text-[var(--color-text-secondary)] mx-auto opacity-40" />
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                        Lớp học này hiện chưa có học viên nào tham gia.
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Hãy gửi mã lớp <code className="font-bold text-[var(--color-primary)]">{inspectingClass.class_code}</code> cho học viên để học viên nhập vào hệ thống.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                        Bảng theo dõi tiến độ chi tiết ({classStudents.length} học viên):
                      </span>
                    </div>

                    <div className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-background)]/40">
                      {classStudents.map((st) => {
                        const studentSubmissions = submissions.filter((sub) => sub.user_id === st.id || sub.student_id === st.id);
                        const avgScore =
                          studentSubmissions.length > 0
                            ? Math.round(
                                studentSubmissions.reduce((acc, curr) => acc + (curr.score || 0), 0) /
                                  studentSubmissions.length
                              )
                            : 0;

                        return (
                          <div
                            key={st.id}
                            className="p-4 hover:bg-[var(--color-surface)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--color-primary)] to-indigo-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                {st.displayName ? st.displayName.charAt(0).toUpperCase() : 'H'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-[var(--color-text-primary)]">
                                    {st.displayName}
                                  </span>
                                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                                    HSK {st.current_level}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[var(--color-text-secondary)] font-mono">
                                  {st.email}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-[var(--color-primary)] font-bold">{st.exp_points || 0} XP</span>
                              </div>

                              <div className="bg-[var(--color-surface)] px-3 py-1.5 rounded-xl border border-[var(--color-border)] flex items-center gap-2">
                                <span>Bài nộp: <strong>{studentSubmissions.length}</strong></span>
                                {studentSubmissions.length > 0 && (
                                  <span className="text-emerald-600 font-bold">({avgScore}đ tb)</span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentForDetail(st);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                                <span>Hồ sơ & Tiến độ</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-background)]/50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setInspectingClass(null)}
                className="px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-background)] cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHI TIẾT HỒ SƠ & TIẾN ĐỘ HỌC TẬP TỪNG HỌC VIÊN */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[var(--color-border)] bg-[var(--color-background)]/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--color-primary)] to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {selectedStudentForDetail.displayName
                    ? selectedStudentForDetail.displayName.charAt(0).toUpperCase()
                    : 'H'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                      {selectedStudentForDetail.displayName}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                      HSK {selectedStudentForDetail.current_level}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] font-mono">
                    {selectedStudentForDetail.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudentForDetail(null)}
                className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {(() => {
                const studentDetailSubs = submissions.filter(
                  (s) => s.user_id === selectedStudentForDetail.id || s.student_id === selectedStudentForDetail.id
                );
                const studentDetailAvg =
                  studentDetailSubs.length > 0
                    ? Math.round(
                        studentDetailSubs.reduce((acc, curr) => acc + (curr.score || 0), 0) /
                          studentDetailSubs.length
                      )
                    : 0;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1">
                      <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-semibold">
                        Trình Độ HSK
                      </span>
                      <p className="text-lg font-extrabold text-[var(--color-primary)]">
                        HSK {selectedStudentForDetail.current_level}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1">
                      <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-semibold">
                        Bài Tập Đã Làm
                      </span>
                      <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                        {studentDetailSubs.length} bài
                      </p>
                      <p className="text-[10px] text-[var(--color-text-secondary)]">
                        {studentDetailSubs.length > 0 ? `Điểm TB: ${studentDetailAvg}đ` : 'Chưa có bài nộp'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1">
                      <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-semibold">
                        Điểm Tích Lũy
                      </span>
                      <p className="text-lg font-extrabold text-[var(--color-primary)]">
                        ⭐ {selectedStudentForDetail.exp_points || 0} XP
                      </p>
                      <p className="text-[10px] text-[var(--color-text-secondary)]">Từ luyện tập & bài tập</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1">
                      <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-semibold">
                        Lớp Đang Tham Gia
                      </span>
                      <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                        {classes.find((c) => c.id === selectedStudentForDetail.class_id)?.class_name || 'Học tự do'}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-secondary)]">
                        Mã: {selectedStudentForDetail.class_code || 'Chưa gán'}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Assignments & Submissions History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>
                    Lịch sử bài tập & Bài nộp (
                    {submissions.filter(
                      (s) => s.user_id === selectedStudentForDetail.id || s.student_id === selectedStudentForDetail.id
                    ).length}
                    ):
                  </span>
                </h4>

                {(() => {
                  const studentSubs = submissions.filter(
                    (s) => s.user_id === selectedStudentForDetail.id || s.student_id === selectedStudentForDetail.id
                  );

                  if (studentSubs.length === 0) {
                    return (
                      <div className="p-5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] text-center text-xs text-[var(--color-text-secondary)]">
                        Học viên chưa nộp bài tập nào qua hệ thống.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {studentSubs.map((sub) => {
                        const asg = assignments.find((a) => a.id === sub.assignment_id);

                        return (
                          <div
                            key={sub.id}
                            className="p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <p className="font-bold text-[var(--color-text-primary)]">
                                {asg ? asg.title : 'Bài tập'}
                              </p>
                              <p className="text-[11px] text-[var(--color-text-secondary)]">
                                Nộp lúc: {sub.submitted_at || sub.completed_at || 'Đã nộp'}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              {sub.score !== undefined ? (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-extrabold text-xs">
                                  {sub.score} điểm
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 font-bold text-xs">
                                  Chờ chấm
                                </span>
                              )}
                              {sub.feedback && (
                                <p className="text-[11px] text-[var(--color-text-secondary)] italic max-w-xs truncate">
                                  &quot;{sub.feedback}&quot;
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-background)]/50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentForDetail(null)}
                className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: LIST SUBMISSIONS FOR AN ASSIGNMENT */}
      {selectedAsgForSubmissions && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] max-w-3xl w-full rounded-2xl border border-[var(--color-border)] p-6 space-y-5 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-primary)]">
                  Danh sách bài nộp của học sinh
                </span>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  {selectedAsgForSubmissions.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAsgForSubmissions(null)}
                className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {(() => {
                const asgSubs = submissions.filter((s) => s.assignment_id === selectedAsgForSubmissions.id);
                if (asgSubs.length === 0) {
                  return (
                    <div className="p-8 text-center bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                      Chưa có học sinh nào nộp bài làm cho bài tập này.
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {asgSubs.map((sub) => {
                      const hasWriting = sub.answers && Object.values(sub.answers).some((val) => {
                        try {
                          const parsed = JSON.parse(val);
                          return parsed && parsed.transcribedText !== undefined;
                        } catch (e) {
                          return false;
                        }
                      });

                      return (
                        <div
                          key={sub.id}
                          className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-all flex items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-[var(--color-text-primary)]">
                              {sub.user_name || sub.student_name || sub.user_email || 'Học viên'}
                            </p>
                            <p className="text-[11px] text-[var(--color-text-secondary)]">
                              Nộp lúc: {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString('vi-VN') : 'Đã nộp'}
                            </p>
                            {hasWriting && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                                ✍️ Chứa bài tự luận viết tay (OCR)
                              </span>
                            )}
                            {sub.teacher_voice_url && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                🎙️ Đã có Voice chấm phát âm
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              {sub.score !== undefined ? (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-extrabold text-xs">
                                  {sub.score} điểm
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 font-bold text-xs">
                                  Chờ chấm
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSubmissionForDetail(sub);
                                setManualScore(sub.score || 0);
                                setManualFeedback(sub.feedback || '');
                                setManualVoiceUrl(sub.teacher_voice_url || '');
                                setManualVoiceDuration(sub.teacher_voice_duration || 0);
                                setManualPronunciationNotes(sub.pronunciation_notes || []);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold transition-all cursor-pointer"
                            >
                              Chi tiết & Chấm điểm
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-[var(--color-border)] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAsgForSubmissions(null)}
                className="px-4 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAILED SUBMISSION REVIEW & OVERRIDE GRADING */}
      {selectedSubmissionForDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] max-w-4xl w-full rounded-2xl border border-[var(--color-border)] p-6 space-y-5 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-primary)]">
                  Chấm điểm chi tiết bài làm của học viên
                </span>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  Học viên: {selectedSubmissionForDetail.user_name || selectedSubmissionForDetail.user_email}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmissionForDetail(null)}
                className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {/* Grading override panel */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[var(--color-primary-light)]/20 to-purple-500/5 border border-[var(--color-primary)]/20 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-text-primary)]">
                    Điểm số bài làm (0 - 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={manualScore}
                    onChange={(e) => setManualScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-bold focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-[var(--color-text-primary)]">
                    Nhận xét văn bản của Giáo viên
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualFeedback}
                      onChange={(e) => setManualFeedback(e.target.value)}
                      placeholder="Viết nhận xét bổ sung hoặc lời động viên cho học sinh..."
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                    <button
                      type="button"
                      disabled={isSavingGrading}
                      onClick={handleSaveGrading}
                      className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingGrading ? 'Đang lưu...' : 'Lưu điểm & Voice'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Dedicated Teacher Voice Feedback Recorder & Pronunciation Correction */}
              <TeacherVoiceRecorder
                initialVoiceUrl={manualVoiceUrl}
                initialDuration={manualVoiceDuration}
                initialNotes={manualPronunciationNotes}
                onSaveVoice={(voiceUrl, duration, notes) => {
                  setManualVoiceUrl(voiceUrl);
                  setManualVoiceDuration(duration);
                  setManualPronunciationNotes(notes);
                }}
                onRemoveVoice={() => {
                  setManualVoiceUrl('');
                  setManualVoiceDuration(0);
                  setManualPronunciationNotes([]);
                }}
              />

              {/* Answers Details rendering */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Chi tiết từng câu hỏi & Bài làm học viên:
                </h4>

                {(() => {
                  const asg = selectedAsgForSubmissions;
                  if (!asg) return null;
                  const exam = onlineExams.find((e) => e.id === asg.content_ref_id);
                  if (!exam || !exam.questions) {
                    return (
                      <div className="text-xs text-[var(--color-text-secondary)] italic">
                        Không tìm thấy cấu trúc đề thi gốc để đối chiếu câu hỏi.
                      </div>
                    );
                  }

                  return exam.questions.map((q, idx) => {
                    const studentAnsRaw = selectedSubmissionForDetail.answers?.[idx] || '';
                    let isWriting = q.type === 'writing';
                    let writingData: any = null;

                    if (isWriting) {
                      try {
                        writingData = JSON.parse(studentAnsRaw);
                      } catch (e) {
                        // ignore
                      }
                    }

                    return (
                      <div
                        key={q.id || idx}
                        className="p-5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-4"
                      >
                        {/* Question title */}
                        <div className="flex items-start justify-between gap-2 border-b border-[var(--color-border)] pb-2.5">
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold text-[10px]">
                              Câu {idx + 1}
                            </span>
                            <span className="ml-2 text-xs font-bold text-[var(--color-text-primary)]">
                              {q.prompt}
                            </span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">
                            {q.type}
                          </span>
                        </div>

                        {/* Traditional / MCQ answer display */}
                        {!isWriting ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs space-y-1">
                              <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-semibold">
                                Đáp án của học sinh:
                              </p>
                              <p className={`font-bold ${studentAnsRaw.toLowerCase() === String(q.correctAnswer).toLowerCase() ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {studentAnsRaw || '(Chưa trả lời)'}
                              </p>
                            </div>

                            <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs space-y-1">
                              <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-semibold">
                                Đáp án đúng hệ thống:
                              </p>
                              <p className="font-bold text-emerald-600">
                                {String(q.correctAnswer)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* WRITING (HANDWRITING OCR) SPLIT-PANE REVIEW */
                          <div className="space-y-4">
                            {!writingData ? (
                              <div className="text-xs text-[var(--color-text-secondary)] italic p-4 text-center">
                                Học sinh chưa tải lên ảnh chụp bài viết tay tự luận cho câu hỏi này.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* Left side: Original uploaded handwriting image */}
                                <div className="space-y-1.5 p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                                  <span className="text-[10px] uppercase font-extrabold text-[var(--color-text-secondary)] block">
                                    🖼️ Ảnh gốc học sinh viết tay:
                                  </span>
                                  {writingData.image ? (
                                    <div className="rounded-xl overflow-hidden border border-[var(--color-border)] aspect-video bg-black/5 flex items-center justify-center">
                                      <img
                                        src={writingData.image}
                                        alt="Uploaded handwriting document"
                                        referrerPolicy="no-referrer"
                                        className="max-h-full max-w-full object-contain"
                                      />
                                    </div>
                                  ) : (
                                    <div className="text-xs text-[var(--color-text-secondary)] italic py-8 text-center">
                                      Không có dữ liệu hình ảnh.
                                    </div>
                                  )}
                                </div>

                                {/* Right side: OCR bóc tách và Đánh giá AI */}
                                <div className="space-y-3 p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs">
                                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
                                    <span className="text-[10px] uppercase font-extrabold text-purple-700 dark:text-purple-300">
                                      🤖 Bóc tách OCR & Chấm điểm AI:
                                    </span>
                                    <span className="text-[11px] font-black text-purple-600 bg-purple-500/15 px-2 py-0.5 rounded-md font-mono">
                                      AI gợi ý: {writingData.score} điểm
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    <div>
                                      <strong className="text-[var(--color-text-primary)]">Bản phiên chữ Hán:</strong>
                                      <p className="p-2 rounded-lg bg-[var(--color-background)] font-serif text-sm font-bold text-[var(--color-text-primary)] mt-1 whitespace-pre-wrap leading-relaxed">
                                        {writingData.studentAdjustedText || writingData.transcribedText}
                                      </p>
                                    </div>

                                    {writingData.pinyin && (
                                      <div>
                                        <strong className="text-[var(--color-text-primary)]">Phiên âm Pinyin:</strong>
                                        <p className="text-[11px] font-mono text-[var(--color-primary)] pl-1">
                                          {writingData.pinyin}
                                        </p>
                                      </div>
                                    )}

                                    {writingData.vietnamese && (
                                      <div>
                                        <strong className="text-[var(--color-text-primary)]">Dịch tiếng Việt:</strong>
                                        <p className="text-[11px] text-[var(--color-text-secondary)] italic pl-1">
                                          {writingData.vietnamese}
                                        </p>
                                      </div>
                                    )}

                                    {/* Grammar and structural corrections */}
                                    {writingData.grammarFeedback && writingData.grammarFeedback.length > 0 && (
                                      <div className="space-y-1.5 pt-1.5 border-t border-[var(--color-border)]/50">
                                        <strong className="text-[var(--color-text-primary)] text-[11px]">Phân tích lỗi ngữ pháp:</strong>
                                        <div className="space-y-1.5">
                                          {writingData.grammarFeedback.map((err: any, eIdx: number) => (
                                            <div key={eIdx} className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/10 text-[11px] space-y-1">
                                              <p className="font-semibold text-rose-500">
                                                ❌ Chỗ chưa chuẩn: <span className="font-normal font-serif text-[var(--color-text-primary)] line-through">{err.original}</span>
                                              </p>
                                              <p className="font-semibold text-emerald-600">
                                                ✅ Gợi ý sửa: <span className="font-normal font-serif text-[var(--color-text-primary)]">{err.correction}</span>
                                              </p>
                                              <p className="text-[10px] text-[var(--color-text-secondary)] italic">
                                                💡 Lý do: {err.explanation}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Overall feedback */}
                                    <div className="pt-2 border-t border-[var(--color-border)]/50">
                                      <strong className="text-[var(--color-text-primary)]">Nhận xét chi tiết của AI:</strong>
                                      <p className="text-[11px] text-[var(--color-text-secondary)] italic leading-relaxed mt-1">
                                        &quot;{writingData.overallFeedback}&quot;
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--color-border)] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSubmissionForDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] cursor-pointer"
              >
                Đóng bài làm học sinh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
