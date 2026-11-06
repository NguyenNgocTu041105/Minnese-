import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  UploadCloud,
  FileText,
  RefreshCw,
  Shuffle,
  Wand2,
  Sliders,
  CheckCircle2,
  Trash2,
  Eye,
  Plus,
  Play,
  Volume2,
  Layers,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  GraduationCap,
  Clock,
  Send,
  HelpCircle,
  Edit2,
  ChevronDown,
  ChevronUp,
  QrCode,
  Share2,
  MessageCircle,
  Download,
} from 'lucide-react';
import {
  WorkbookDoc,
  OnlineExamDoc,
  QuizQuestion,
  HSKLevel,
  ClassDoc,
  AssignmentDoc,
} from '../../types';
import {
  fetchWorkbooksFromFirestore,
  saveWorkbookToFirestore,
  deleteWorkbookInFirestore,
  fetchOnlineExamsFromFirestore,
  saveOnlineExamToFirestore,
  deleteOnlineExamInFirestore,
  saveAssignmentToFirestore,
} from '../../lib/firebase';
import { playChineseAudio } from '../../utils/chineseAudio';

interface WorkbookStudioProps {
  classes: ClassDoc[];
  currentAdminEmail: string;
  currentAdminName: string;
}

export const WorkbookStudio: React.FC<WorkbookStudioProps> = ({
  classes,
  currentAdminEmail,
  currentAdminName,
}) => {
  // Navigation inside Studio
  const [subTab, setSubTab] = useState<'bank' | 'upload' | 'remix' | 'exams'>('bank');

  // Stored state
  const [workbooks, setWorkbooks] = useState<WorkbookDoc[]>([]);
  const [onlineExams, setOnlineExams] = useState<OnlineExamDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ success: boolean; message: string } | null>(null);

  // Upload & OCR Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadHsk, setUploadHsk] = useState<HSKLevel>(1);
  const [uploadSourceType, setUploadSourceType] = useState<'images' | 'text'>('text');
  const [pastedText, setPastedText] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [parsedPreviewQuestions, setParsedPreviewQuestions] = useState<QuizQuestion[]>([]);
  const [showParsedReview, setShowParsedReview] = useState(false);

  // Remixer Form State
  const [selectedWorkbookId, setSelectedWorkbookId] = useState<string>('all');
  const [remixMode, setRemixMode] = useState<'shuffle' | 'grammar_variants' | 'transformed' | 'comprehensive' | 'writing_focus'>('grammar_variants');
  const [remixExamTitle, setRemixExamTitle] = useState('Đề luyện thi & kiểm tra kiến thức');
  const [remixCustomTopic, setRemixCustomTopic] = useState('');
  const [remixHsk, setRemixHsk] = useState<HSKLevel>(1);
  const [remixQuestionCount, setRemixQuestionCount] = useState<number>(10);
  const [remixDuration, setRemixDuration] = useState<number>(15);
  const [remixDeadlineDays, setRemixDeadlineDays] = useState<number>(3);
  const [remixTargetType, setRemixTargetType] = useState<'all' | 'class' | 'level'>('all');
  const [remixTargetClassId, setRemixTargetClassId] = useState<string>('');
  const [isRemixing, setIsRemixing] = useState(false);
  const [generatedExamQuestions, setGeneratedExamQuestions] = useState<QuizQuestion[]>([]);
  const [showExamPreview, setShowExamPreview] = useState(false);

  // Exam Published Modal State
  const [publishedExam, setPublishedExam] = useState<OnlineExamDoc | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDirectLink, setCopiedDirectLink] = useState(false);
  const [zaloToast, setZaloToast] = useState<string | null>(null);
  const [showEnlargedQr, setShowEnlargedQr] = useState(false);

  // Question Accordion State for preview
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Viewing & Editing Workbook details modal state
  const [viewingWorkbook, setViewingWorkbook] = useState<WorkbookDoc | null>(null);
  const [isAddingQuestionToWb, setIsAddingQuestionToWb] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState<QuizQuestion['type']>('writing');
  const [newQuestionPrompt, setNewQuestionPrompt] = useState('');
  const [newQuestionChinese, setNewQuestionChinese] = useState('');
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>(['', '', '', '']);
  const [newQuestionCorrect, setNewQuestionCorrect] = useState('');
  const [newQuestionExplanation, setNewQuestionExplanation] = useState('');

  // Load Workbooks and Exams from Firestore on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [wbList, examList] = await Promise.all([
        fetchWorkbooksFromFirestore(),
        fetchOnlineExamsFromFirestore(),
      ]);

      // Seed starter workbook if empty for immediate demo value
      if (wbList.length === 0) {
        const defaultWb: WorkbookDoc = {
          id: `wb-starter-hsk1`,
          title: 'Sách Bài Tập HSK 1 Chuẩn - Bộ đề trắc nghiệm cơ bản',
          description: 'Tuyển tập 10 câu hỏi ngữ pháp, phiên âm Pinyin và từ vựng thông dụng bài 1-15.',
          hsk_level: 1,
          total_questions: 7,
          raw_text: 'Sách bài tập mẫu HSK 1 chứa các dạng câu chào hỏi, chữ 把, trợ từ 的/得, và lượng từ cơ bản.',
          parsed_questions: [
            {
              id: 'q-demo-1',
              type: 'pinyin',
              prompt: 'Chọn phiên âm Pinyin chuẩn của từ "谢谢" (cảm ơn):',
              questionChinese: '谢谢',
              options: ['xièxie', 'xiěxie', 'xièxiè', 'xiēxie'],
              correctAnswer: 'xièxie',
              explanation: 'Từ 谢谢 gồm âm tiết thứ nhất thanh 4 (xiè) và âm thứ hai là thanh nhẹ (xie).',
              hskLevel: 1,
            },
            {
              id: 'q-demo-2',
              type: 'grammar',
              prompt: 'Chọn lượng từ thích hợp: "我买了一___书":',
              questionChinese: '我买了一___书',
              options: ['本 (quyển/cuốn)', '个 (cái/người)', '张 (tờ/tấm)', '支 (cây/chiếc)'],
              correctAnswer: '本 (quyển/cuốn)',
              explanation: 'Lượng từ "本" (běn) chuyên dùng cho sách vở, tiểu thuyết, từ điển (一本书, 两本词典).',
              hskLevel: 1,
            },
            {
              id: 'q-demo-3',
              type: 'fill_blank',
              prompt: 'Điền từ thích hợp vào câu: "明天天气___好":',
              questionChinese: '明天天气___好',
              options: ['很 (rất)', '是 (là)', '在 (ở)', '了 (rồi)'],
              correctAnswer: '很 (rất)',
              explanation: 'Phó từ chỉ mức độ "很" thường đứng trước tính từ "好" trong câu vị ngữ tính từ.',
              hskLevel: 1,
            },
            {
              id: 'q-demo-4',
              type: 'meaning',
              prompt: 'Chọn nghĩa tiếng Việt của câu "认识你很高兴":',
              questionChinese: '认识你很高兴',
              options: [
                'Rất vui được làm quen với bạn',
                'Hẹn gặp lại bạn vào ngày mai',
                'Bạn có khỏe không?',
                'Cảm ơn sự giúp đỡ của bạn',
              ],
              correctAnswer: 'Rất vui được làm quen với bạn',
              explanation: '认识 (rènshi - làm quen/biết) + 你 (bạn) + 很高兴 (rất vui/rất phấn khởi).',
              hskLevel: 1,
            },
            {
              id: 'q-demo-5',
              type: 'word_order',
              prompt: 'Sắp xếp các từ sau thành câu hoàn chỉnh:',
              questionChinese: '是 / 中国人 / 我 / 不是',
              options: [
                '我不是中国人。(Tôi không phải là người Trung Quốc)',
                '我是不中国人。',
                '中国人我不不是。',
                '我中国人是不是。',
              ],
              correctAnswer: '我不是中国人。(Tôi không phải là người Trung Quốc)',
              explanation: 'Cấu trúc câu phủ định với "是": Chủ ngữ + 不是 + Danh từ/Tân ngữ.',
              hskLevel: 1,
            },
            {
              id: 'q-demo-6',
              type: 'grammar',
              prompt: 'Chọn phó từ biểu thị phủ định trong quá khứ: "昨天我___去学校":',
              questionChinese: '昨天我___去学校',
              options: ['没 (chưa/không)', '不 (không)', '别 (đừng)', '无 (không có)'],
              correctAnswer: '没 (chưa/không)',
              explanation: 'Phủ định hành động đã xảy ra trong quá khứ hoặc chưa hoàn thành dùng "没/没有", không dùng "不".',
              hskLevel: 1,
            },
            {
              id: 'q-demo-7',
              type: 'writing',
              prompt: 'Hãy viết tay đoạn văn ngắn (50-80 chữ) giới thiệu bản thân bằng chữ Hán ra giấy, chụp ảnh bài làm và tải lên. AI sẽ tự động bóc tách chữ viết tay (OCR) và chấm điểm.',
              questionChinese: 'Bài viết tay (Tự luận): Giới thiệu bản thân (自我介绍)',
              options: [],
              correctAnswer: 'Học sinh nộp ảnh bài viết tay để AI và giáo viên chấm',
              explanation: 'Đây là bài viết tự luận viết tay. AI sẽ tự động bóc tách chữ viết tay (OCR), phiên âm, dịch nghĩa, nhận diện nét bút và chấm điểm tự luận hỗ trợ giáo viên.',
              hskLevel: 1,
            },
          ],
          created_by: currentAdminEmail || 'admin@minnese.app',
          created_at: new Date().toISOString(),
        };
        setWorkbooks([defaultWb]);
        saveWorkbookToFirestore(defaultWb).catch((err) => {
          console.warn('Initial default workbook saved locally, Firestore sync skipped:', err);
        });
      } else {
        setWorkbooks(wbList);
      }

      setOnlineExams(examList || []);
    } catch (e) {
      console.error('Error loading workbook data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (success: boolean, message: string) => {
    setToast({ success, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Image Upload Handler (Convert files to Base64)
  const handleImageFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files).slice(0, 5); // Limit 5 pages
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Trigger OCR & Parsing
  const handleProcessWorkbook = async () => {
    if (!uploadTitle.trim()) {
      showNotification(false, 'Vui lòng nhập tên Bộ Sách Bài Tập (ví dụ: Sách Bài Tập HSK 1 - Bài 1 đến 5).');
      return;
    }
    if (uploadSourceType === 'text' && !pastedText.trim()) {
      showNotification(false, 'Vui lòng dán nội dung bài tập vào ô văn bản trước khi xử lý.');
      return;
    }
    if (uploadSourceType === 'images' && uploadedImages.length === 0) {
      showNotification(false, 'Vui lòng chọn ít nhất 1 hình ảnh trang sách bài tập scan trước khi bóc tách.');
      return;
    }
    // Validate image size (mỗi ảnh base64 không nên vượt 4MB ~ 5.5MB base64)
    if (uploadSourceType === 'images') {
      const oversized = uploadedImages.filter((img) => img.length > 5_500_000);
      if (oversized.length > 0) {
        showNotification(false, `⚠️ ${oversized.length} ảnh quá lớn (>4MB). Vui lòng nén ảnh hoặc chụp lại với độ phân giải thấp hơn.`);
        return;
      }
    }

    setIsOcrProcessing(true);
    try {
      const res = await fetch('/api/workbooks/parse-and-remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'parse_raw',
          rawText: pastedText,
          images: uploadedImages,
          targetHsk: uploadHsk,
          questionCount: 10,
        }),
      });

      const data = await res.json();
      if (data.success && data.parsedQuestions && data.parsedQuestions.length > 0) {
        setParsedPreviewQuestions(data.parsedQuestions);
        setShowParsedReview(true);
        showNotification(
          true,
          `✨ AI đã bóc tách thành công ${data.parsedQuestions.length} câu hỏi bài tập từ tài liệu của bạn!`
        );
      } else {
        showNotification(false, 'Không thể bóc tách câu hỏi. Vui lòng kiểm tra lại văn bản hoặc ảnh.');
      }
    } catch (err: any) {
      console.error('Error processing workbook:', err);
      showNotification(false, 'Lỗi kết nối khi bóc tách sách bài tập: ' + (err?.message || err));
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Save parsed questions as a new Workbook in the Bank
  const handleSaveWorkbookToBank = async () => {
    if (parsedPreviewQuestions.length === 0) return;

    const newWb: WorkbookDoc = {
      id: `wb-${Date.now()}`,
      title: uploadTitle.trim(),
      description: uploadDesc.trim() || `Tài liệu bài tập HSK ${uploadHsk} gồm ${parsedPreviewQuestions.length} câu hỏi.`,
      hsk_level: uploadHsk,
      total_questions: parsedPreviewQuestions.length,
      raw_text: pastedText || 'Nội dung sách bài tập từ ảnh chụp / scan.',
      parsed_questions: parsedPreviewQuestions,
      created_by: currentAdminEmail,
      created_at: new Date().toISOString(),
    };

    setWorkbooks([newWb, ...workbooks]);
    await saveWorkbookToFirestore(newWb);

    // Reset form
    setUploadTitle('');
    setUploadDesc('');
    setPastedText('');
    setUploadedImages([]);
    setShowParsedReview(false);
    setParsedPreviewQuestions([]);
    setSubTab('bank');

    showNotification(
      true,
      `🎉 Đã lưu bộ sách "${newWb.title}" (${newWb.total_questions} câu) vào Ngân hàng Bài tập!`
    );
  };

  // Delete a workbook
  const handleDeleteWorkbook = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bộ sách bài tập "${title}"?`)) return;
    setWorkbooks((prev) => prev.filter((w) => w.id !== id));
    await deleteWorkbookInFirestore(id);
    showNotification(true, `Đã xóa bộ sách bài tập "${title}".`);
  };

  // Add question to a workbook
  const handleAddQuestionToWorkbook = async () => {
    if (!viewingWorkbook) return;
    if (!newQuestionPrompt.trim()) {
      alert('Vui lòng nhập đề bài câu hỏi.');
      return;
    }

    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      type: newQuestionType,
      prompt: newQuestionPrompt.trim(),
      questionChinese: newQuestionChinese.trim() || undefined,
      options: newQuestionType === 'writing' ? [] : newQuestionOptions.filter((o) => o.trim() !== ''),
      correctAnswer: newQuestionType === 'writing' ? 'Học sinh nộp ảnh bài viết tay để AI và giáo viên chấm' : newQuestionCorrect.trim(),
      explanation: newQuestionExplanation.trim() || (newQuestionType === 'writing' ? 'Đây là bài viết tự luận viết tay. AI sẽ tự động bóc tách chữ Hán (OCR), phiên âm, dịch nghĩa và chấm điểm.' : undefined),
      hskLevel: viewingWorkbook.hsk_level,
    };

    const updatedWb: WorkbookDoc = {
      ...viewingWorkbook,
      parsed_questions: [...(viewingWorkbook.parsed_questions || []), newQ],
      total_questions: (viewingWorkbook.parsed_questions?.length || 0) + 1,
    };

    setViewingWorkbook(updatedWb);
    setWorkbooks((prev) => prev.map((w) => (w.id === updatedWb.id ? updatedWb : w)));
    await saveWorkbookToFirestore(updatedWb);

    // Reset form
    setIsAddingQuestionToWb(false);
    setNewQuestionPrompt('');
    setNewQuestionChinese('');
    setNewQuestionOptions(['', '', '', '']);
    setNewQuestionCorrect('');
    setNewQuestionExplanation('');

    showNotification(true, '✨ Đã thêm câu hỏi mới vào sách bài tập!');
  };

  // Delete question from workbook
  const handleDeleteQuestionFromWorkbook = async (qId: string) => {
    if (!viewingWorkbook) return;
    const updatedQuestions = (viewingWorkbook.parsed_questions || []).filter((q) => q.id !== qId);
    const updatedWb: WorkbookDoc = {
      ...viewingWorkbook,
      parsed_questions: updatedQuestions,
      total_questions: updatedQuestions.length,
    };

    setViewingWorkbook(updatedWb);
    setWorkbooks((prev) => prev.map((w) => (w.id === updatedWb.id ? updatedWb : w)));
    await saveWorkbookToFirestore(updatedWb);
    showNotification(true, 'Đã xóa câu hỏi khỏi sách bài tập.');
  };

  // AI Exam Remix Trigger
  const handleGenerateRemixExam = async () => {
    if (!remixExamTitle.trim()) {
      showNotification(false, 'Vui lòng nhập Tiêu đề Đề Thi Online trước khi tạo.');
      return;
    }

    setIsRemixing(true);
    try {
      let sourceQuestions: QuizQuestion[] = [];
      let rawTextContext = '';

      if (selectedWorkbookId === 'all') {
        workbooks.forEach((w) => {
          sourceQuestions.push(...w.parsed_questions);
        });
      } else {
        const targetWb = workbooks.find((w) => w.id === selectedWorkbookId);
        if (targetWb) {
          sourceQuestions = targetWb.parsed_questions;
          rawTextContext = targetWb.raw_text || '';
        }
      }

      // Guard: Kiểm tra ngân hàng câu hỏi không rỗng
      if (sourceQuestions.length === 0 && !rawTextContext.trim()) {
        showNotification(false, '⚠️ Ngân hàng câu hỏi đang trống. Vui lòng tải lên sách bài tập trước khi trộn đề.');
        setIsRemixing(false);
        return;
      }

      const res = await fetch('/api/workbooks/parse-and-remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remix_exam',
          sourceQuestions: sourceQuestions,
          rawText: rawTextContext,
          remixMode: remixMode,
          targetHsk: remixHsk,
          questionCount: remixQuestionCount,
          examTitle: remixExamTitle,
          customTopic: remixCustomTopic,
        }),
      });

      const data = await res.json();
      if (data.success && data.questions && data.questions.length > 0) {
        setGeneratedExamQuestions(data.questions);
        setShowExamPreview(true);
        showNotification(
          true,
          `🪄 AI đã phối trộn & tạo thành công ${data.questions.length} câu hỏi cho đề "${remixExamTitle}"!`
        );
      } else {
        showNotification(false, 'Không thể tạo đề thi. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.error('Error generating remix exam:', err);
      showNotification(false, 'Lỗi khi tạo đề thi: ' + (err?.message || err));
    } finally {
      setIsRemixing(false);
    }
  };

  // Publish the generated exam to students
  const handlePublishOnlineExam = async () => {
    if (generatedExamQuestions.length === 0) return;

    // Generate random 4-digit code e.g. EXAM-8291
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    const examCode = `EXAM-${randDigits}`;
    const selectedClass = classes.find((c) => c.id === remixTargetClassId);

    const sourceWb = workbooks.find((w) => w.id === selectedWorkbookId);

    const newExam: OnlineExamDoc = {
      id: `exam-${Date.now()}`,
      exam_code: examCode,
      title: remixExamTitle.trim(),
      description: `Đề thi trực tuyến chế độ ${
        remixMode === 'shuffle'
          ? 'Xáo trộn ngẫu nhiên'
          : remixMode === 'grammar_variants'
          ? 'Biến thể ngữ pháp thực tế'
          : remixMode === 'transformed'
          ? 'Chuyển đổi dạng bài'
          : 'Tổng hợp chuẩn HSK'
      } (${generatedExamQuestions.length} câu - ${remixDuration > 0 ? `${remixDuration} phút` : 'Không giới hạn giờ'}).`,
      hsk_level: remixHsk,
      duration_minutes: remixDuration,
      target_type: remixTargetType,
      target_class_id: remixTargetType === 'class' && remixTargetClassId ? remixTargetClassId : '',
      questions: generatedExamQuestions,
      total_points: generatedExamQuestions.length * 10,
      remix_mode: remixMode,
      source_workbook_id: selectedWorkbookId !== 'all' ? selectedWorkbookId : '',
      source_workbook_title: sourceWb ? sourceWb.title : 'Tổng hợp ngân hàng đề',
      created_by: currentAdminEmail,
      created_at: new Date().toISOString(),
      is_active: true,
    };

    // Save exam in Firestore
    await saveOnlineExamToFirestore(newExam);
    setOnlineExams([newExam, ...onlineExams]);

    const deadlineDate = new Date(Date.now() + (remixDeadlineDays || 3) * 86400000);
    deadlineDate.setHours(23, 59, 0, 0);

    // Also automatically publish an Assignment so students in that class see it in their Dashboard
    const autoAssignment: AssignmentDoc = {
      id: `assign-exam-${Date.now()}`,
      title: `[Đề thi Online] ${newExam.title} (Mã: ${newExam.exam_code})`,
      description: `Bài kiểm tra trực tuyến: ${generatedExamQuestions.length} câu hỏi. Thời gian: ${
        remixDuration > 0 ? `${remixDuration} phút` : 'Tự do'
      }. Bấm vào để làm bài ngay!`,
      target_type: remixTargetType,
      target_class_id: remixTargetType === 'class' ? remixTargetClassId : undefined,
      hsk_level: remixTargetType === 'class' && selectedClass ? selectedClass.hsk_level : remixHsk,
      content_type: 'quiz',
      content_ref_id: newExam.id,
      due_date: deadlineDate.toISOString(),
      created_by: currentAdminEmail,
      created_at: new Date().toISOString(),
      is_active: true,
    };
    await saveAssignmentToFirestore(autoAssignment);

    setPublishedExam(newExam);
    setShowExamPreview(false);
    showNotification(
      true,
      `🎉 Đã xuất bản Đề thi Trực tuyến "${newExam.title}" với Mã làm bài: ${newExam.exam_code}!`
    );
  };

  // Delete an online exam
  const handleDeleteOnlineExam = async (examId: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa Đề thi "${title}"?`)) return;
    setOnlineExams((prev) => prev.filter((e) => e.id !== examId));
    await deleteOnlineExamInFirestore(examId);
    showNotification(true, `Đã xóa đề thi "${title}".`);
  };

  return (
    <div className="space-y-6" id="workbook-studio-container">
      {/* Studio Header Banner */}
      <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-amber-500/10 p-6 rounded-2xl border border-purple-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[var(--color-primary)] text-white shadow-xs">
                <Wand2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                Xưởng Trộn & Chế Biến Đề Thi AI (Workbook & Exam Remixer)
              </h2>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-3xl leading-relaxed">
              Tải lên tài liệu hoặc hình ảnh sách bài tập của bạn. AI sẽ <strong>tự động bóc tách (OCR)</strong> toàn bộ câu hỏi, từ đó cho phép bạn <strong>trộn thứ tự, chế biến câu hỏi biến thể ngữ pháp tương đương</strong> và xuất bản thành <strong>Đề thi Trực tuyến</strong> có mã làm bài cho học viên!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setUploadTitle(`Sách Bài Tập HSK ${remixHsk} - ${new Date().toLocaleDateString('vi-VN')}`);
                setSubTab('upload');
              }}
              className="px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Tải sách bài tập mới</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('remix')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Shuffle className="w-4 h-4" />
              <span>Trộn & Tạo đề thi AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
            toast.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-500'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-xs font-bold hover:underline cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* Studio Sub-Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-[var(--color-border)] pb-2 no-scrollbar">
        <button
          type="button"
          onClick={() => setSubTab('bank')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'bank'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Ngân hàng Sách bài tập ({workbooks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('upload')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'upload'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Tải lên & Bóc tách OCR</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('remix')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'remix'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Bộ Máy Trộn & Chế Đề Thi AI</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('exams')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'exams'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Đề thi Trực tuyến đã phát hành ({onlineExams.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WORKBOOK BANK                                                      */}
      {/* ========================================================================= */}
      {subTab === 'bank' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                Danh sách sách bài tập đã nạp ({workbooks.length})
              </span>
              <span className="text-[11px] text-[var(--color-text-secondary)]">
                • Dùng làm nguồn câu hỏi để trộn và tạo đề thi
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSubTab('upload')}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nạp thêm bài tập</span>
            </button>
          </div>

          {workbooks.length === 0 ? (
            <div className="text-center py-12 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] space-y-3">
              <BookOpen className="w-12 h-12 text-[var(--color-text-secondary)]/40 mx-auto" />
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Chưa có sách bài tập nào trong ngân hàng
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] max-w-md mx-auto">
                Hãy tải lên hình ảnh chụp bài tập hoặc dán nội dung văn bản để AI bóc tách bài tập cho bạn.
              </p>
              <button
                type="button"
                onClick={() => setSubTab('upload')}
                className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)]"
              >
                Tải lên ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workbooks.map((wb) => (
                <div
                  key={wb.id}
                  className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                        HSK {wb.hsk_level}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-secondary)] font-mono">
                        {new Date(wb.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <h3 
                      onClick={() => setViewingWorkbook(wb)}
                      className="text-sm font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-2 cursor-pointer hover:underline"
                    >
                      {wb.title}
                    </h3>

                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                      {wb.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                      <span className="flex items-center gap-1 font-semibold text-[var(--color-text-primary)]">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                        {wb.total_questions || wb.parsed_questions?.length || 0} câu hỏi
                      </span>
                      <span className="text-[11px] truncate max-w-[120px]" title={wb.created_by}>
                        bởi {wb.created_by.split('@')[0]}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingWorkbook(wb)}
                        className="flex-1 py-1.5 rounded-xl bg-[var(--color-primary-light)] hover:bg-[var(--color-primary)] text-[var(--color-primary)] hover:text-white text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title="Xem danh sách câu hỏi & quản lý bài tập"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem chi tiết</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWorkbookId(wb.id);
                          setRemixHsk(wb.hsk_level);
                          setRemixExamTitle(`Đề kiểm tra dựa trên ${wb.title}`);
                          setSubTab('remix');
                        }}
                        className="py-1.5 px-3 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Trộn và chế câu hỏi từ sách bài tập này"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-purple-500" />
                        <span>Trộn đề</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteWorkbook(wb.id, wb.title)}
                        className="p-1.5 rounded-xl hover:bg-rose-500/10 text-[var(--color-text-secondary)] hover:text-rose-500 transition-colors cursor-pointer"
                        title="Xóa bộ sách này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: UPLOAD & OCR WORKBOOK                                              */}
      {/* ========================================================================= */}
      {subTab === 'upload' && (
        <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[var(--color-primary)]" />
              <span>Tải lên Sách bài tập & Bóc tách câu hỏi AI</span>
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Bạn có thể chụp hình trang sách bài tập (JPG/PNG) hoặc dán trực tiếp đề bài dạng văn bản. AI sẽ bóc tách đầy đủ chữ Hán, Pinyin, đáp án đúng và lời giải chi tiết.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text-primary)]">
                Tên Bộ Sách / Chương Bài Tập <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="VD: Sách Bài Tập HSK 2 - Bài 3: Ngữ pháp câu chữ 把"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text-primary)]">
                Trình độ HSK mục tiêu
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setUploadHsk(lvl as HSKLevel)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      uploadHsk === lvl
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
                        : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface)]'
                    }`}
                  >
                    HSK {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text-primary)]">
              Mô tả ngắn gọn (Tùy chọn)
            </label>
            <input
              type="text"
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
              placeholder="VD: Đề bài tập phần đọc hiểu và bài tập điền từ chuẩn bị cho thi giữa kỳ"
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
            />
          </div>

          {/* Source Format Selector */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUploadSourceType('text')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  uploadSourceType === 'text'
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border)]'
                }`}
              >
                📝 Dán văn bản bài tập
              </button>
              <button
                type="button"
                onClick={() => setUploadSourceType('images')}
                disabled
                className="relative px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-not-allowed bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border)] opacity-50"
                title="Tính năng bóc tách ảnh OCR đang được phát triển — sẽ ra mắt trong phiên bản v2.0"
              >
                📸 Tải ảnh scan
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wide">
                  Sắp ra mắt
                </span>
              </button>
            </div>

            {uploadSourceType === 'text' ? (
              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Dán nội dung bài tập vào đây, ví dụ:\nCâu 1: Chọn từ thích hợp điền vào: 他___去北京。A. 想 B. 是 C. 很 D. 吗 (Đáp án: A)\nCâu 2: Sắp xếp từ thành câu: 苹果 / 我 / 吃了 / 把\nCâu 3: 学习 nghĩa là gì?`}
                  className="w-full p-3 text-xs font-mono rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] p-6 rounded-2xl text-center bg-[var(--color-background)] transition-colors">
                  <UploadCloud className="w-8 h-8 text-[var(--color-primary)] mx-auto mb-2" />
                  <p className="text-xs font-bold text-[var(--color-text-primary)]">
                    Chọn hoặc kéo thả các trang sách bài tập (JPG, PNG)
                  </p>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                    Tối đa 5 trang trong một lượt bóc tách
                  </p>
                  <label className="mt-3 inline-block px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] cursor-pointer">
                    Chọn tệp hình ảnh
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageFilesSelected}
                    />
                  </label>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="flex items-center gap-3 overflow-x-auto p-2 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)]">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative group shrink-0">
                        <img
                          src={img}
                          alt={`Uploaded page ${idx + 1}`}
                          className="w-20 h-24 object-cover rounded-lg border border-[var(--color-border)]"
                        />
                        <button
                          type="button"
                          onClick={() => setUploadedImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              disabled={isOcrProcessing}
              onClick={handleProcessWorkbook}
              className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Wand2 className={`w-4 h-4 ${isOcrProcessing ? 'animate-spin' : ''}`} />
              <span>{isOcrProcessing ? 'AI đang bóc tách & phân tích...' : 'AI Bóc Tách Câu Hỏi & Xem Trước'}</span>
            </button>
          </div>

          {/* Parsed Review Preview */}
          {showParsedReview && parsedPreviewQuestions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Xem trước {parsedPreviewQuestions.length} câu hỏi đã bóc tách:</span>
                </h4>
                <button
                  type="button"
                  onClick={handleSaveWorkbookToBank}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác nhận & Lưu vào Ngân Hàng Bài Tập</span>
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {parsedPreviewQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 uppercase">
                          {q.type}
                        </span>
                        <span className="text-xs font-bold text-[var(--color-text-primary)]">
                          {q.prompt}
                        </span>
                      </div>

                      {q.questionChinese && (
                        <button
                          type="button"
                          onClick={() => playChineseAudio(q.questionChinese!)}
                          className="p-1 text-[var(--color-primary)] hover:bg-[var(--color-surface)] rounded-lg"
                          title="Nghe phát âm"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {q.questionChinese && (
                      <p className="text-sm font-medium text-[var(--color-text-primary)] pl-8 font-serif">
                        {q.questionChinese}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 pl-8">
                      {q.options?.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-lg text-xs border ${
                            opt === q.correctAnswer
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold'
                              : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}. {opt}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-[var(--color-text-secondary)] pl-8 italic">
                        💡 Giải thích: {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AI EXAM REMIXER (BỘ MÁY TRỘN & CHẾ ĐỀ THI)                        */}
      {/* ========================================================================= */}
      {subTab === 'remix' && (
        <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--color-border)] space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span>Cấu hình Trộn & Chế Đề Thi Tự Động</span>
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Chọn nguồn sách bài tập và chế độ chế biến mong muốn. AI sẽ tạo ra đề thi hoàn chỉnh, chống học vẹt và kiểm tra đúng năng lực học viên.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Source Selection */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center justify-between">
                <span>1. Nguồn sách bài tập gốc</span>
                <span className="text-[10px] text-[var(--color-primary)] font-semibold">Tự động bám sát ngữ pháp</span>
              </label>
              <select
                value={selectedWorkbookId}
                onChange={(e) => {
                  setSelectedWorkbookId(e.target.value);
                  const found = workbooks.find((w) => w.id === e.target.value);
                  if (found) {
                    setRemixHsk(found.hsk_level);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              >
                <option value="all">⭐ Tổng hợp tất cả sách bài tập đã nạp ({workbooks.length} sách)</option>
                {workbooks.map((wb) => (
                  <option key={wb.id} value={wb.id}>
                    [HSK {wb.hsk_level}] {wb.title} ({wb.total_questions || wb.parsed_questions?.length} câu)
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Exam Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text-primary)]">
                2. Tiêu đề Đề thi Online
              </label>
              <input
                type="text"
                value={remixExamTitle}
                onChange={(e) => setRemixExamTitle(e.target.value)}
                placeholder="VD: Đề Kiểm Tra Định Kỳ 15 Phút - HSK 1 Lớp Tối T2-T4"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* Step 3: Choose Remix Mode */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center justify-between">
              <span>3. Chọn Chế độ Trộn & Chế biến AI (Chọn 1 trong 5 chế độ)</span>
              <span className="text-[10px] font-semibold text-[var(--color-primary)]">
                {remixMode === 'shuffle' && 'Đang chọn: Chế độ [1] Xáo trộn'}
                {remixMode === 'grammar_variants' && 'Đang chọn: Chế độ [2] Biến thể ngữ pháp'}
                {remixMode === 'transformed' && 'Đang chọn: Chế độ [3] Đổi dạng thức'}
                {remixMode === 'writing_focus' && 'Đang chọn: Chế độ [4] Tự luận & Viết tay OCR'}
                {remixMode === 'comprehensive' && 'Đang chọn: Chế độ [5] Tổng hợp HSK'}
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Option 1: Shuffle */}
              <div
                onClick={() => setRemixMode('shuffle')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  remixMode === 'shuffle'
                    ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                    : 'bg-[var(--color-background)] border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                      Chế độ [1]
                    </span>
                    <Shuffle className="w-4 h-4 text-indigo-500" />
                  </div>
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)]">Xáo trộn & Đảo vị trí</h4>
                  <p className="text-[11px] leading-relaxed">
                    Xáo trộn thứ tự câu hỏi và hoán vị đáp án A/B/C/D chống học vẹt.
                  </p>
                </div>
              </div>

              {/* Option 2: Grammar Clone */}
              <div
                onClick={() => setRemixMode('grammar_variants')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  remixMode === 'grammar_variants'
                    ? 'bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                    : 'bg-[var(--color-background)] border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-600 dark:text-purple-300">
                      Chế độ [2]
                    </span>
                    <Wand2 className="w-4 h-4 text-purple-500" />
                  </div>
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)]">Biến thể ngữ pháp thực tế</h4>
                  <p className="text-[11px] leading-relaxed">
                    Giữ nguyên cấu trúc ngữ pháp gốc, đổi chủ ngữ, tân ngữ và ngữ cảnh.
                  </p>
                </div>
              </div>

              {/* Option 3: Format Transformer */}
              <div
                onClick={() => setRemixMode('transformed')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  remixMode === 'transformed'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                    : 'bg-[var(--color-background)] border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300">
                      Chế độ [3]
                    </span>
                    <Sliders className="w-4 h-4 text-amber-500" />
                  </div>
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)]">Đổi dạng thức câu hỏi</h4>
                  <p className="text-[11px] leading-relaxed">
                    Biến trắc nghiệm thành điền từ, sắp xếp câu hoặc cặp từ đồng nghĩa.
                  </p>
                </div>
              </div>

              {/* Option 4: Writing & Essay OCR Focus */}
              <div
                onClick={() => setRemixMode('writing_focus')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  remixMode === 'writing_focus'
                    ? 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-[var(--color-background)] border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-300">
                      Chế độ [4]
                    </span>
                    <Edit2 className="w-4 h-4 text-rose-500" />
                  </div>
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)]">Tự luận & Viết tay OCR</h4>
                  <p className="text-[11px] leading-relaxed">
                    Tạo bài tập Viết tay ra giấy. Học sinh tải ảnh chữ Hán, AI tự động soi nét chấm điểm.
                  </p>
                </div>
              </div>

              {/* Option 5: Full Mock Exam */}
              <div
                onClick={() => setRemixMode('comprehensive')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  remixMode === 'comprehensive'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-[var(--color-background)] border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                      Chế độ [5]
                    </span>
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)]">Tổng hợp chuẩn HSK</h4>
                  <p className="text-[11px] leading-relaxed">
                    Tổng hợp toàn diện: Pinyin, Ngữ pháp, Từ vựng, Đọc hiểu & Viết tay OCR.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: External Topic Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center justify-between">
              <span>4. Gợi ý chủ đề / Nguồn tài liệu ngoài mở rộng (Tùy chọn)</span>
              <span className="text-[10px] text-[var(--color-primary)] font-normal">
                ✨ Áp dụng cho Chế độ [{remixMode === 'shuffle' ? '1' : remixMode === 'grammar_variants' ? '2' : remixMode === 'transformed' ? '3' : remixMode === 'writing_focus' ? '4' : '5'}]
              </span>
            </label>
            <input
              type="text"
              value={remixCustomTopic}
              onChange={(e) => setRemixCustomTopic(e.target.value)}
              placeholder={
                remixMode === 'writing_focus'
                  ? 'VD: Viết chữ Hán/Đoạn văn tự luận về chủ đề Công nghệ thông tin, Đi mua sắm, Gia đình...'
                  : 'VD: Chủ đề Đi du lịch Trung Quốc, Mua sắm online, Đời sống sinh viên, Từ vựng công nghệ...'
              }
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {/* Step 5, 6, 7: Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text-primary)]">
                5. Số lượng câu hỏi
              </label>
              <select
                value={remixQuestionCount}
                onChange={(e) => setRemixQuestionCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              >
                <option value={5}>5 câu (Kiểm tra nhanh 5 phút)</option>
                <option value={10}>10 câu (Đề bài tập chuẩn)</option>
                <option value={15}>15 câu (Kiểm tra 15 phút)</option>
                <option value={20}>20 câu (Đề kiểm tra 1 tiết)</option>
                <option value={30}>30 câu (Đề thi thử HSK)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text-primary)]">
                6. Thời gian làm bài (Phút)
              </label>
              <select
                value={remixDuration}
                onChange={(e) => setRemixDuration(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              >
                <option value={0}>Không giới hạn thời gian</option>
                <option value={5}>5 phút (Nhanh)</option>
                <option value={10}>10 phút</option>
                <option value={15}>15 phút</option>
                <option value={30}>30 phút</option>
                <option value={45}>45 phút (1 tiết)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text-primary)]">
                7. Đối tượng giao đề
              </label>
              <select
                value={remixTargetType === 'class' ? `class:${remixTargetClassId}` : remixTargetType}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith('class:')) {
                    setRemixTargetType('class');
                    setRemixTargetClassId(val.replace('class:', ''));
                  } else {
                    setRemixTargetType(val as 'all' | 'level');
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              >
                <option value="all">🌐 Tất cả học viên</option>
                <option value="level">🎯 Theo trình độ HSK {remixHsk}</option>
                {classes.map((c) => (
                  <option key={c.id} value={`class:${c.id}`}>
                    🏫 Lớp: {c.class_name} ({c.class_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center justify-between">
                <span>8. Hạn nộp & Tự động xóa</span>
                <span className="text-[10px] text-emerald-600 font-semibold">⏰ Auto-delete</span>
              </label>
              <select
                value={remixDeadlineDays}
                onChange={(e) => setRemixDeadlineDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] font-medium"
              >
                <option value={1}>1 ngày (Hết hạn sau 24h)</option>
                <option value={3}>3 ngày (Mặc định - Khuyến nghị)</option>
                <option value={5}>5 ngày</option>
                <option value={7}>7 ngày (1 tuần)</option>
                <option value={14}>14 ngày (2 tuần)</option>
              </select>
            </div>
          </div>

          {/* Action Generate */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              disabled={isRemixing}
              onClick={handleGenerateRemixExam}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Wand2 className={`w-4 h-4 ${isRemixing ? 'animate-spin' : ''}`} />
              <span>{isRemixing ? 'AI đang trộn & biên soạn đề...' : 'Trộn & Sinh Đề Thi Trực Tuyến'}</span>
            </button>
          </div>

          {/* Generated Exam Preview */}
          {showExamPreview && generatedExamQuestions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-600 text-white">
                      ĐỀ THI ĐÃ SẴN SÀNG
                    </span>
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                      {remixExamTitle}
                    </h4>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Gồm {generatedExamQuestions.length} câu • Thời gian: {remixDuration > 0 ? `${remixDuration} phút` : 'Tự do'} • Cấp độ: HSK {remixHsk}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePublishOnlineExam}
                  className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Xuất bản & Lấy Mã Đề Thi Online</span>
                </button>
              </div>

              {/* List of Questions in Preview */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {generatedExamQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-[var(--color-text-primary)]">
                          {q.prompt}
                        </span>
                      </div>

                      {q.questionChinese && (
                        <button
                          type="button"
                          onClick={() => playChineseAudio(q.questionChinese!)}
                          className="p-1 text-[var(--color-primary)] hover:bg-[var(--color-surface)] rounded-lg cursor-pointer"
                          title="Nghe phát âm câu hỏi"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {q.questionChinese && (
                      <p className="text-sm font-medium text-[var(--color-text-primary)] pl-8 font-serif">
                        {q.questionChinese}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                      {q.options?.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl text-xs border ${
                            opt === q.correctAnswer
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold'
                              : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}. {opt}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-[var(--color-text-secondary)] pl-8 italic">
                        💡 Giải thích: {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PUBLISHED ONLINE EXAMS (ĐỀ THI ĐÃ PHÁT HÀNH)                       */}
      {/* ========================================================================= */}
      {subTab === 'exams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)]">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                Đề thi trực tuyến đang mở ({onlineExams.length})
              </span>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                Học viên chỉ cần nhập Mã Đề Thi để làm bài ngay trong mục "Luyện tập" hoặc Dashboard.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSubTab('remix')}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo đề mới</span>
            </button>
          </div>

          {onlineExams.length === 0 ? (
            <div className="text-center py-12 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] space-y-3">
              <GraduationCap className="w-12 h-12 text-[var(--color-text-secondary)]/40 mx-auto" />
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Chưa có Đề thi Trực tuyến nào được tạo
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] max-w-md mx-auto">
                Hãy sử dụng Bộ máy Trộn & Chế Đề Thi để tạo đề thi từ sách bài tập của bạn.
              </p>
              <button
                type="button"
                onClick={() => setSubTab('remix')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
              >
                Trộn đề thi ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {onlineExams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        {exam.exam_code}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                        HSK {exam.hsk_level}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
                      {exam.title}
                    </h3>

                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                      {exam.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                      <span className="flex items-center gap-1 font-semibold text-[var(--color-text-primary)]">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {exam.duration_minutes > 0 ? `${exam.duration_minutes} phút` : 'Tự do'}
                      </span>
                      <span className="font-semibold">
                        {exam.questions?.length || 0} câu hỏi
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPublishedExam(exam);
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-[var(--color-primary-light)] hover:bg-[var(--color-primary)] text-[var(--color-primary)] hover:text-white text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Mã & Lời mời</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteOnlineExam(exam.id, exam.title)}
                        className="p-1.5 rounded-xl hover:bg-rose-500/10 text-[var(--color-text-secondary)] hover:text-rose-500 transition-colors cursor-pointer"
                        title="Xóa đề thi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EXAM PUBLISHED / SHARE WITH STUDENTS VIA ZALO & QR CODE             */}
      {/* ========================================================================= */}
      {publishedExam && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--color-surface)] max-w-xl w-full rounded-2xl border border-[var(--color-border)] p-6 space-y-5 shadow-2xl animate-in zoom-in-95 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    Đề Thi Trực Tuyến Đã Phát Hành!
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Chia sẻ mã, link trực tiếp hoặc mã QR vào nhóm Zalo lớp học
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPublishedExam(null)}
                className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)] rounded-lg cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Zalo Toast Banner */}
            {zaloToast && (
              <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <Share2 className="w-4 h-4 shrink-0 text-blue-500" />
                <span>{zaloToast}</span>
              </div>
            )}

            {/* Exam Code & Direct Link Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Mã Đề Thi Trực Tuyến
                  </span>
                  <div className="flex items-center gap-2 justify-center sm:justify-start mt-0.5">
                    <span className="text-2xl font-black font-mono tracking-wider text-purple-600 dark:text-purple-400">
                      {publishedExam.exam_code}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(publishedExam.exam_code);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="p-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-bold hover:border-purple-500 transition-colors cursor-pointer"
                      title="Sao chép mã"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="w-full sm:w-auto text-center sm:text-right">
                  <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Link Trực Tiếp Làm Bài
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/?exam=${publishedExam.exam_code}`}
                      className="w-full sm:w-48 px-2.5 py-1 text-[11px] font-mono rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const directUrl = `${window.location.origin}/?exam=${publishedExam.exam_code}`;
                        navigator.clipboard.writeText(directUrl);
                        setCopiedDirectLink(true);
                        setTimeout(() => setCopiedDirectLink(false), 2000);
                      }}
                      className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                      title="Sao chép Link trực tiếp"
                    >
                      {copiedDirectLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code & Zalo Fast Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)]">
              {/* QR Code Column */}
              <div className="flex flex-col items-center justify-center space-y-2 border-b sm:border-b-0 sm:border-r border-[var(--color-border)] pb-3 sm:pb-0 sm:pr-3">
                <div className="p-2 rounded-xl bg-white border border-gray-200 shadow-sm relative group">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                      `${window.location.origin}/?exam=${publishedExam.exam_code}`
                    )}`}
                    alt={`Mã QR Đề thi ${publishedExam.exam_code}`}
                    className="w-28 h-28 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEnlargedQr(true)}
                    className="absolute inset-0 bg-black/40 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer"
                  >
                    🔍 Phóng to QR
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                        `${window.location.origin}/?exam=${publishedExam.exam_code}`
                      )}`;
                      window.open(qrUrl, '_blank');
                    }}
                    className="text-[11px] text-[var(--color-primary)] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Tải ảnh QR</span>
                  </button>
                  <span className="text-[10px] text-[var(--color-text-secondary)]">•</span>
                  <button
                    type="button"
                    onClick={() => setShowEnlargedQr(true)}
                    className="text-[11px] text-[var(--color-text-secondary)] font-medium hover:underline cursor-pointer"
                  >
                    Trình chiếu
                  </button>
                </div>
              </div>

              {/* Zalo Notice Info Column */}
              <div className="sm:col-span-2 space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-600 dark:text-blue-300">
                      Tích hợp Zalo Lớp Học
                    </span>
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">Gửi tự động 1-Click</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Bấm nút bên dưới để tự động sao chép mẫu tin nhắn chứa mã đề + Link trực tiếp và mở sẵn Zalo Web. Bạn chỉ cần ấn <kbd className="px-1 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[10px] font-mono">Ctrl + V</kbd> vào nhóm lớp.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const directUrl = `${window.location.origin}/?exam=${publishedExam.exam_code}`;
                      const msg = `📢 THÔNG BÁO BÀI KIỂM TRA TRỰC TUYẾN - MINNESE\n📚 Đề thi: ${publishedExam.title}\n🎯 Cấp độ: HSK ${publishedExam.hsk_level} (${publishedExam.questions?.length} câu hỏi)\n⏱️ Thời gian: ${publishedExam.duration_minutes > 0 ? `${publishedExam.duration_minutes} phút` : 'Tự do'}\n🔑 Mã đề thi: ${publishedExam.exam_code}\n🔗 Link làm bài trực tiếp: ${directUrl}\n👉 Học viên click vào link trên hoặc chọn mục "Luyện tập" -> Nhập mã "${publishedExam.exam_code}" để làm bài ngay!`;

                      navigator.clipboard.writeText(msg);
                      setZaloToast('Đã sao chép tin nhắn & Link đề thi! Đang mở Zalo, hãy bấm Ctrl + V (Dán) vào nhóm lớp.');
                      window.open('https://chat.zalo.me', '_blank');
                      setTimeout(() => setZaloToast(null), 5000);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#0068FF] hover:bg-[#0052cc] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Mở Zalo & Dán Tin Nhắn (Ctrl+V)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const directUrl = `${window.location.origin}/?exam=${publishedExam.exam_code}`;
                      const msg = `📢 THÔNG BÁO BÀI KIỂM TRA TRỰC TUYẾN - MINNESE\n📚 Đề thi: ${publishedExam.title}\n🎯 Cấp độ: HSK ${publishedExam.hsk_level} (${publishedExam.questions?.length} câu hỏi)\n⏱️ Thời gian: ${publishedExam.duration_minutes > 0 ? `${publishedExam.duration_minutes} phút` : 'Tự do'}\n🔑 Mã đề thi: ${publishedExam.exam_code}\n🔗 Link làm bài trực tiếp: ${directUrl}\n👉 Học viên click vào link trên hoặc chọn mục "Luyện tập" -> Nhập mã "${publishedExam.exam_code}" để làm bài ngay!`;

                      navigator.clipboard.writeText(msg);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    title="Chỉ sao chép văn bản"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Đã sao chép!' : 'Copy tin nhắn'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Ready to send announcement preview */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center justify-between">
                <span>Nội dung tin nhắn xem trước:</span>
                <span className="text-[10px] text-[var(--color-text-secondary)]">Sẵn sàng để dán vào Zalo / Messenger</span>
              </label>
              <textarea
                readOnly
                rows={5}
                value={`📢 THÔNG BÁO BÀI KIỂM TRA TRỰC TUYẾN - MINNESE\n📚 Đề thi: ${publishedExam.title}\n🎯 Cấp độ: HSK ${publishedExam.hsk_level} (${publishedExam.questions?.length} câu hỏi)\n⏱️ Thời gian: ${publishedExam.duration_minutes > 0 ? `${publishedExam.duration_minutes} phút` : 'Tự do'}\n🔑 Mã đề thi: ${publishedExam.exam_code}\n🔗 Link làm bài trực tiếp: ${window.location.origin}/?exam=${publishedExam.exam_code}\n👉 Học viên click vào link trên hoặc chọn mục "Luyện tập" -> Nhập mã "${publishedExam.exam_code}" để làm bài ngay!`}
                className="w-full p-3 text-xs font-mono rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setPublishedExam(null)}
                className="px-5 py-2 rounded-xl bg-[var(--color-background)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] cursor-pointer"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged QR Modal for Class Screen Projection */}
      {showEnlargedQr && publishedExam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-gray-900 max-w-sm w-full rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wider">
                Quét Mã QR Làm Bài
              </h3>
              <button
                type="button"
                onClick={() => setShowEnlargedQr(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex flex-col items-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                  `${window.location.origin}/?exam=${publishedExam.exam_code}`
                )}`}
                alt="QR Code"
                className="w-56 h-56 object-contain"
              />
              <span className="mt-2 text-xl font-mono font-black text-purple-700 tracking-widest">
                {publishedExam.exam_code}
              </span>
            </div>

            <p className="text-xs text-gray-600">
              Học viên dùng Camera điện thoại hoặc Zalo quét mã QR để vào thẳng đề thi <b>{publishedExam.title}</b>
            </p>

            <button
              type="button"
              onClick={() => setShowEnlargedQr(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-md cursor-pointer"
            >
              Đóng trình chiếu
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW & MANAGE WORKBOOK QUESTIONS (XEM CHI TIẾT SÁCH BÀI TẬP)        */}
      {/* ========================================================================= */}
      {viewingWorkbook && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] max-w-4xl w-full max-h-[90vh] rounded-2xl border border-[var(--color-border)] p-6 space-y-5 shadow-2xl flex flex-col animate-in zoom-in-95 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[var(--color-border)] pb-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                    HSK {viewingWorkbook.hsk_level}
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    {viewingWorkbook.parsed_questions?.length || 0} câu hỏi
                  </span>
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  {viewingWorkbook.title}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {viewingWorkbook.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setViewingWorkbook(null);
                  setIsAddingQuestionToWb(false);
                }}
                className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl bg-[var(--color-background)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--color-background)] p-3 rounded-xl border border-[var(--color-border)] shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewQuestionType('writing');
                    setIsAddingQuestionToWb(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>+ Thêm câu hỏi Viết tay (OCR)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewQuestionType('grammar');
                    setIsAddingQuestionToWb(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm câu hỏi trắc nghiệm</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedWorkbookId(viewingWorkbook.id);
                  setRemixHsk(viewingWorkbook.hsk_level);
                  setRemixExamTitle(`Đề kiểm tra dựa trên ${viewingWorkbook.title}`);
                  setViewingWorkbook(null);
                  setSubTab('remix');
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Trộn thành Đề thi AI</span>
              </button>
            </div>

            {/* Form: Add New Question inline */}
            {isAddingQuestionToWb && (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-4 shrink-0 overflow-y-auto max-h-80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>Thêm câu hỏi mới vào sách bài tập</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingQuestionToWb(false)}
                    className="text-xs text-[var(--color-text-secondary)] hover:underline cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[var(--color-text-primary)]">
                      Dạng câu hỏi
                    </label>
                    <select
                      value={newQuestionType}
                      onChange={(e) => setNewQuestionType(e.target.value as QuizQuestion['type'])}
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                    >
                      <option value="writing">🖋️ Bài viết tay (Tự luận OCR)</option>
                      <option value="grammar">🧩 Ngữ pháp & Cấu trúc câu</option>
                      <option value="pinyin">🔤 Phiên âm Pinyin</option>
                      <option value="meaning">📖 Từ vựng & Ngữ nghĩa</option>
                      <option value="fill_blank">✏️ Điền từ vào chỗ trống</option>
                      <option value="word_order">🔀 Sắp xếp thứ tự từ</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[var(--color-text-primary)]">
                      Câu Hán / Đoạn mẫu (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={newQuestionChinese}
                      onChange={(e) => setNewQuestionChinese(e.target.value)}
                      placeholder="VD: 我想去中国 (Nếu có)"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-serif"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--color-text-primary)]">
                    Đề bài / Yêu cầu câu hỏi <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={newQuestionPrompt}
                    onChange={(e) => setNewQuestionPrompt(e.target.value)}
                    placeholder={
                      newQuestionType === 'writing'
                        ? 'VD: Hãy viết tay đoạn văn ngắn (50-80 chữ) giới thiệu về gia đình bạn bằng chữ Hán ra giấy, chụp ảnh bài làm tải lên.'
                        : 'VD: Chọn từ thích hợp điền vào chỗ trống...'
                    }
                    className="w-full p-2.5 text-xs rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                  />
                </div>

                {newQuestionType === 'writing' ? (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <span>✨ Tính năng Viết tay & Gemini OCR:</span>
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      Học sinh sẽ làm bài bằng cách chụp ảnh nét chữ viết tay ra giấy. AI sẽ tự động soi nét chữ Hán, chuyển thành văn bản số hóa, phiên âm Pinyin, kiểm tra lỗi ngữ pháp và đưa ra điểm gợi ý cho giáo viên.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[var(--color-text-primary)]">
                      Các đáp án lựa chọn A, B, C, D:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {newQuestionOptions.map((opt, oIdx) => (
                        <input
                          key={oIdx}
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newQuestionOptions];
                            updated[oIdx] = e.target.value;
                            setNewQuestionOptions(updated);
                          }}
                          placeholder={`Đáp án ${String.fromCharCode(65 + oIdx)}`}
                          className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                        />
                      ))}
                    </div>

                    <div className="space-y-1 pt-1">
                      <label className="text-[11px] font-bold text-[var(--color-text-primary)]">
                        Đáp án đúng (Viết chính xác như 1 trong các đáp án ở trên):
                      </label>
                      <input
                        type="text"
                        value={newQuestionCorrect}
                        onChange={(e) => setNewQuestionCorrect(e.target.value)}
                        placeholder="VD: 想"
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-bold text-emerald-600"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--color-text-primary)]">
                    Lời giải & Giải thích chi tiết
                  </label>
                  <input
                    type="text"
                    value={newQuestionExplanation}
                    onChange={(e) => setNewQuestionExplanation(e.target.value)}
                    placeholder="VD: Dùng phó từ 想 khi muốn thể hiện nguyện vọng..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddQuestionToWorkbook}
                    className="px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Lưu câu hỏi
                  </button>
                </div>
              </div>
            )}

            {/* List of Questions in Workbook */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {(!viewingWorkbook.parsed_questions || viewingWorkbook.parsed_questions.length === 0) ? (
                <div className="text-center py-10 text-xs text-[var(--color-text-secondary)]">
                  Chưa có câu hỏi nào trong sách bài tập này. Nhấn nút "+ Thêm câu hỏi" để tạo mới!
                </div>
              ) : (
                viewingWorkbook.parsed_questions.map((q, idx) => {
                  const isWriting = q.type === 'writing';
                  return (
                    <div
                      key={q.id || idx}
                      className={`p-4 rounded-xl border space-y-2 transition-all ${
                        isWriting
                          ? 'bg-amber-500/5 border-amber-500/30 dark:bg-amber-500/10'
                          : 'bg-[var(--color-background)] border-[var(--color-border)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-6 h-6 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              isWriting
                                ? 'bg-amber-500 text-white'
                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                            {isWriting ? '🖋️ VIẾT TAY (OCR)' : q.type}
                          </span>
                          <span className="text-xs font-bold text-[var(--color-text-primary)]">
                            {q.prompt}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {q.questionChinese && (
                            <button
                              type="button"
                              onClick={() => playChineseAudio(q.questionChinese!)}
                              className="p-1 text-[var(--color-primary)] hover:bg-[var(--color-surface)] rounded-lg cursor-pointer"
                              title="Nghe phát âm"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestionFromWorkbook(q.id)}
                            className="p-1 text-[var(--color-text-secondary)] hover:text-rose-500 rounded-lg cursor-pointer"
                            title="Xóa câu hỏi này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {q.questionChinese && (
                        <p className="text-sm font-medium text-[var(--color-text-primary)] pl-8 font-serif">
                          {q.questionChinese}
                        </p>
                      )}

                      {isWriting ? (
                        <div className="ml-8 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Hình thức nộp bài: Tải ảnh viết tay (Gemini OCR)</span>
                          </div>
                          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                            {q.correctAnswer}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                          {q.options?.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-2.5 rounded-xl text-xs border ${
                                opt === q.correctAnswer
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold'
                                  : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.explanation && (
                        <p className="text-[11px] text-[var(--color-text-secondary)] pl-8 italic">
                          💡 Lời giải / Gợi ý: {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)] shrink-0">
              <span className="text-xs text-[var(--color-text-secondary)]">
                Tổng cộng: <strong>{viewingWorkbook.parsed_questions?.length || 0}</strong> câu hỏi trong ngân hàng sách
              </span>
              <button
                type="button"
                onClick={() => {
                  setViewingWorkbook(null);
                  setIsAddingQuestionToWb(false);
                }}
                className="px-5 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

