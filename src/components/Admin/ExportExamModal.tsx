import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Code,
  Download,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export interface ExportFilePayload {
  format: 'xlsx' | 'docx' | 'json';
  question_ids?: string[];
  questions?: any[];
  filter?: {
    level?: string | number;
    skill?: string;
    part_type?: string;
    status?: string;
  };
  exam_title?: string;
  include_answers?: boolean;
  include_explanations?: boolean;
  include_pinyin?: boolean;
  duration_minutes?: number;
}

/**
 * Triggers direct browser download for binary (xlsx, docx) or text (json) files
 * from the /api/qbank/export endpoint.
 */
export async function downloadExportFile(
  exportUrl: string,
  payload: ExportFilePayload,
  fallbackFileName: string,
  onTokenExpired?: () => void
): Promise<void> {
  const token =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('qbank_admin_token') || localStorage.getItem('qbank_admin_token')
      : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-QBank-Admin-Token'] = token;
    headers['X-Admin-Token'] = token;
  }

  const res = await fetch(exportUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (res.status === 401 || res.status === 403) {
    if (onTokenExpired) onTokenExpired();
    throw new Error('Phiên làm việc hết hạn hoặc chưa xác thực (401/403). Vui lòng nhập mã Admin Token.');
  }

  if (!res.ok) {
    let errMsg = `Xuất file thất bại (Mã lỗi: ${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson.error) errMsg = errJson.error;
    } catch {}
    throw new Error(errMsg);
  }

  const blob = await res.blob();
  let fileName = fallbackFileName;
  const disposition = res.headers.get('Content-Disposition') || res.headers.get('content-disposition');
  if (disposition) {
    const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      fileName = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
    }
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = blobUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(blobUrl);
  }, 350);
}

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  count: number;
  questionIds?: string[];
  questions?: any[];
  filterParams?: any;
  defaultExamTitle?: string;
  onTokenExpired?: () => void;
}

export const ExportExamModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  title,
  count,
  questionIds,
  questions,
  filterParams,
  defaultExamTitle = 'De_Thi_HSK_Minnese',
  onTokenExpired,
}) => {
  const [format, setFormat] = useState<'xlsx' | 'docx' | 'json'>('docx');
  const [examTitle, setExamTitle] = useState(defaultExamTitle);
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [includePinyin, setIncludePinyin] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExecuteExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);

    const ext = format;
    const cleanTitle = (examTitle.trim() || 'De_Thi_HSK').replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
    const cleanDate = new Date().toISOString().slice(0, 10);
    const fileName = `${cleanTitle}_${cleanDate}.${ext}`;

    try {
      await downloadExportFile(
        '/api/qbank/export',
        {
          format,
          question_ids: questionIds,
          questions,
          filter: filterParams,
          exam_title: cleanTitle,
          include_answers: includeAnswers,
          include_explanations: includeExplanations,
          include_pinyin: includePinyin,
        },
        fileName,
        onTokenExpired
      );
      setExportSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setExportError(err.message || 'Lỗi khi tạo và tải file đề thi.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">{title}</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Đang xuất <strong>{count}</strong> câu hỏi ra tệp tin
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Cards */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--color-text-secondary)]">Chọn định dạng xuất:</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              data-testid="btn-format-docx"
              onClick={() => setFormat('docx')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                format === 'docx'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold ring-2 ring-blue-500/20'
                  : 'border-[var(--color-border)] hover:bg-[var(--color-background)] text-[var(--color-text-secondary)]'
              }`}
            >
              <FileText className="w-6 h-6 mx-auto mb-1 text-blue-500" />
              <div className="text-xs font-bold">Word (.docx)</div>
              <div className="text-[10px] opacity-75">In ấn & Đề thi</div>
            </button>

            <button
              type="button"
              data-testid="btn-format-xlsx"
              onClick={() => setFormat('xlsx')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                format === 'xlsx'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/20'
                  : 'border-[var(--color-border)] hover:bg-[var(--color-background)] text-[var(--color-text-secondary)]'
              }`}
            >
              <FileSpreadsheet className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
              <div className="text-xs font-bold">Excel (.xlsx)</div>
              <div className="text-[10px] opacity-75">Bảng & Ma trận</div>
            </button>

            <button
              type="button"
              data-testid="btn-format-json"
              onClick={() => setFormat('json')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                format === 'json'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold ring-2 ring-purple-500/20'
                  : 'border-[var(--color-border)] hover:bg-[var(--color-background)] text-[var(--color-text-secondary)]'
              }`}
            >
              <Code className="w-6 h-6 mx-auto mb-1 text-purple-500" />
              <div className="text-xs font-bold">JSON (.json)</div>
              <div className="text-[10px] opacity-75">Sao lưu dữ liệu</div>
            </button>
          </div>
        </div>

        {/* Exam Title Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Tiêu đề đề thi / Tên file:</label>
          <input
            type="text"
            data-testid="input-export-title"
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-semibold focus:outline-hidden focus:border-[var(--color-primary)]"
            placeholder="VD: De_Thi_HSK_1_Mock"
          />
        </div>

        {/* Options Checkboxes */}
        <div className="space-y-2 pt-1 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              data-testid="checkbox-export-answers"
              checked={includeAnswers}
              onChange={(e) => setIncludeAnswers(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--color-primary)]"
            />
            <span className="font-semibold text-[var(--color-text-primary)]">Bao gồm Bảng Đáp án (Answer Key)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              data-testid="checkbox-export-explanations"
              checked={includeExplanations}
              onChange={(e) => setIncludeExplanations(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--color-primary)]"
            />
            <span className="font-semibold text-[var(--color-text-primary)]">Bao gồm Lời giải chi tiết tiếng Việt</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              data-testid="checkbox-export-pinyin"
              checked={includePinyin}
              onChange={(e) => setIncludePinyin(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--color-primary)]"
            />
            <span className="font-semibold text-[var(--color-text-primary)]">Bao gồm phiên âm Pinyin</span>
          </label>
        </div>

        {exportError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        {exportSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Đã tạo file và bắt đầu tải xuống thành công!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            data-testid="btn-execute-export"
            onClick={handleExecuteExport}
            disabled={isExporting}
            className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xuất file...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Tải file về máy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
