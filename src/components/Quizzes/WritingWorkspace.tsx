import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  RefreshCw,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Edit3,
} from 'lucide-react';

interface WritingWorkspaceProps {
  promptText: string;
  onAnswerSaved: (answerJsonString: string) => void;
  savedAnswerJson?: string;
}

interface WritingResult {
  image?: string;
  transcribedText: string;
  pinyin?: string;
  vietnamese?: string;
  score?: number;
  handwritingFeedback?: string;
  grammarFeedback?: Array<{
    original: string;
    correction: string;
    explanation: string;
  }>;
  overallFeedback?: string;
  studentAdjustedText?: string;
}

export const WritingWorkspace: React.FC<WritingWorkspaceProps> = ({
  promptText,
  onAnswerSaved,
  savedAnswerJson,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WritingResult | null>(null);
  const [studentText, setStudentText] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved answer if available
  useEffect(() => {
    if (savedAnswerJson) {
      try {
        const parsed = JSON.parse(savedAnswerJson) as WritingResult;
        setResult(parsed);
        setImagePreview(parsed.image || null);
        setStudentText(parsed.studentAdjustedText || parsed.transcribedText || '');
      } catch (e) {
        console.warn('Error parsing saved writing answer:', e);
      }
    } else {
      // Reset state for new question
      setImagePreview(null);
      setResult(null);
      setStudentText('');
      setError(null);
    }
  }, [savedAnswerJson]);

  // Loading statuses rotation to make the AI feel extremely responsive and alive
  const loadingStatuses = [
    'AI đang tải hình ảnh viết tay lên...',
    'Đang khởi động công cụ nhận diện thông minh OCR...',
    'Đang bóc tách từng nét bút chữ Hán (Hanzi)...',
    'Phân tích ngữ pháp và cấu trúc câu...',
    'Tra cứu từ điển và đối chiếu chuẩn HSK...',
    'Biên soạn nhận xét nét viết và lỗi ngữ pháp...',
  ];

  const startLoadingStatusCycle = () => {
    let index = 0;
    setStatusMessage(loadingStatuses[0]);
    statusIntervalRef.current = setInterval(() => {
      index = (index + 1) % loadingStatuses.length;
      setStatusMessage(loadingStatuses[index]);
    }, 3000);
  };

  const stopLoadingStatusCycle = () => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopLoadingStatusCycle();
  }, []);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Convert file to Base64 & start OCR
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng tải lên một tệp hình ảnh (JPEG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      setImagePreview(base64String);
      setError(null);
      await runOcr(base64String);
    };
    reader.onerror = () => {
      setError('Lỗi khi đọc tệp hình ảnh.');
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Call server-side OCR endpoint
  const runOcr = async (base64Image: string) => {
    setIsProcessing(true);
    startLoadingStatusCycle();
    try {
      const response = await fetch('/api/ai/ocr-and-grade-writing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          promptText: promptText,
        }),
      });

      if (!response.ok) {
        throw new Error('Lỗi từ máy chủ OCR.');
      }

      const data = await response.json();
      const newResult: WritingResult = {
        image: base64Image,
        transcribedText: data.transcribedText,
        pinyin: data.pinyin,
        vietnamese: data.vietnamese,
        score: data.score,
        handwritingFeedback: data.handwritingFeedback,
        grammarFeedback: data.grammarFeedback,
        overallFeedback: data.overallFeedback,
        studentAdjustedText: data.transcribedText,
      };

      setResult(newResult);
      setStudentText(data.transcribedText);

      // Save answer
      onAnswerSaved(JSON.stringify(newResult));
    } catch (e: any) {
      console.error('[WritingWorkspace] OCR run failed:', e);
      setError(e?.message || 'Có lỗi xảy ra khi kết nối với máy chủ AI OCR.');
    } finally {
      setIsProcessing(false);
      stopLoadingStatusCycle();
    }
  };

  // Let student manually update text if OCR had a minor mismatch
  const handleStudentTextChange = (newText: string) => {
    setStudentText(newText);
    if (result) {
      const updated = {
        ...result,
        studentAdjustedText: newText,
      };
      setResult(updated);
      onAnswerSaved(JSON.stringify(updated));
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setResult(null);
    setStudentText('');
    setError(null);
    onAnswerSaved('');
  };

  return (
    <div className="space-y-5" id="handwriting-ocr-workspace">
      {/* Visual notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5 leading-relaxed">
        <Sparkles className="w-5 h-5 shrink-0 text-amber-500 mt-0.5 animate-pulse" />
        <div>
          <strong className="block mb-0.5">✍️ Bài Làm Viết Tay Tự Luận:</strong>
          Bạn hãy viết tay bài làm ra giấy kẻ ô hoặc giấy trắng, chụp ảnh thật rõ nét, sau đó tải lên hoặc kéo thả vào khung bên dưới. Hệ thống sẽ bóc tách chữ viết tay thành văn bản số để giáo viên và AI kiểm tra.
        </div>
      </div>

      {/* Upload area or Image preview */}
      {!imagePreview ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3.5 ${
            dragActive
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/20 scale-[0.99]'
              : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-background)]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-[var(--color-text-primary)]">
              Kéo thả ảnh hoặc Nhấn để tải lên
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Hỗ trợ PNG, JPG, JPEG từ điện thoại hoặc máy tính
            </p>
          </div>

          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] hover:border-[var(--color-primary)] flex items-center gap-1.5 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Chụp ảnh trực tiếp</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left pane: Image & Reset option */}
          <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] flex items-center gap-1">
                <FileImage className="w-3.5 h-3.5 text-blue-500" />
                <span>Ảnh chụp bài viết tay</span>
              </span>
              <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)] aspect-video bg-black/5 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Student handwriting upload"
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>

            {!isProcessing && (
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-500/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Chụp / Tải ảnh khác</span>
              </button>
            )}
          </div>

          {/* Right pane: Processing or Results */}
          <div className="p-5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] min-h-[220px] flex flex-col justify-center">
            {isProcessing ? (
              <div className="text-center py-6 space-y-4">
                <div className="relative w-12 h-12 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-[var(--color-primary-light)]" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-[var(--color-primary)] animate-spin" />
                </div>
                <div className="space-y-1 animate-pulse">
                  <p className="text-xs font-bold text-[var(--color-primary)]">
                    Smart OCR đang xử lý...
                  </p>
                  <p className="text-[11px] text-[var(--color-text-secondary)] italic">
                    {statusMessage}
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-4 space-y-3">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <p className="text-xs font-bold text-[var(--color-text-primary)]">{error}</p>
                <button
                  type="button"
                  onClick={() => runOcr(imagePreview)}
                  className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)]"
                >
                  Thử lại nhận diện AI
                </button>
              </div>
            ) : result ? (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* OCR Text Edit Confirmation */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] flex items-center justify-between">
                    <span>Phiên lại chữ Hán (Bạn có thể sửa nếu AI nhận diện nhầm):</span>
                    <span className="text-[9px] text-[var(--color-primary)] font-semibold flex items-center gap-0.5">
                      <Edit3 className="w-3 h-3" /> Tự hiệu chỉnh
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    value={studentText}
                    onChange={(e) => handleStudentTextChange(e.target.value)}
                    placeholder="Chữ viết tay của học sinh sẽ hiển thị ở đây..."
                    className="w-full p-2.5 text-sm font-medium rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-serif focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                {/* AI Instant feedback preview */}
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-extrabold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Kết quả đánh giá sơ bộ của AI</span>
                    </span>
                    <span className="text-xs font-black text-purple-600 bg-purple-500/20 px-2 py-0.5 rounded-md font-mono">
                      ⭐ {result.score} / 100 điểm
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                    <strong className="text-[var(--color-text-primary)]">Lời khuyên:</strong> {result.overallFeedback}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[11px] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Đã lưu bài viết tay thành công! Tiến hành làm câu tiếp theo.</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[var(--color-text-secondary)]">
                Vui lòng tải lên ảnh bài viết tay để AI thực hiện bóc tách tự động.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
