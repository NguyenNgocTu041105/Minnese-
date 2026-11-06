import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  Save,
  X,
  Sparkles,
  Zap,
  Info,
} from 'lucide-react';
import {
  getBYOKConfig,
  saveBYOKConfig,
  clearBYOKConfig,
  testGeminiKey,
  KeyTestResult,
} from '../utils/byokStorage';

interface BYOKModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BYOKModal: React.FC<BYOKModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<KeyTestResult | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  // Load existing config on open
  useEffect(() => {
    if (isOpen) {
      const config = getBYOKConfig();
      if (config.geminiApiKey) {
        setGeminiKeyInput(config.geminiApiKey);
        setHasExistingKey(true);
      } else {
        setGeminiKeyInput('');
        setHasExistingKey(false);
      }
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!geminiKeyInput.trim()) {
      setTestResult({
        success: false,
        message: 'Vui lòng nhập khóa API Gemini trước khi kiểm tra.',
      });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testGeminiKey(geminiKeyInput.trim());
      setTestResult(result);
    } catch {
      setTestResult({
        success: false,
        message: 'Lỗi không xác định khi kiểm tra khóa.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const trimmed = geminiKeyInput.trim();
    if (!trimmed) {
      setTestResult({
        success: false,
        message: 'Khóa API không được để trống.',
      });
      return;
    }

    saveBYOKConfig({
      geminiApiKey: trimmed,
      provider: 'gemini',
    });

    setHasExistingKey(true);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      if (onSuccess) onSuccess();
      onClose();
    }, 900);
  };

  const handleClear = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khóa API khỏi trình duyệt? Bạn sẽ quay lại chế độ Tiêu chuẩn / RAG Offline.')) {
      clearBYOKConfig();
      setGeminiKeyInput('');
      setHasExistingKey(false);
      setTestResult({
        success: true,
        message: 'Đã xóa khóa API thành công.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl text-[var(--color-text-primary)] p-5 sm:p-7 space-y-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="byok-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 id="byok-modal-title" className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                Cấu hình AI Key Cá Nhân (BYOK)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono font-semibold">
                  100% Free
                </span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Sử dụng API Key riêng để mở khóa Gọi Thoại AI và trò chuyện không giới hạn.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            title="Đóng modal (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Callout if key exists */}
        {hasExistingKey && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Khóa cá nhân đang hoạt động trên trình duyệt của bạn.</span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold text-[11px] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa Key
            </button>
          </div>
        )}

        {/* Step-by-step instructions to get free key */}
        <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <p className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Cách lấy Google Gemini API Key hoàn toàn miễn phí:
            </p>
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1 font-semibold text-[11px]"
            >
              Mở Google AI Studio
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[var(--color-text-secondary)] leading-relaxed pl-1">
            <li>
              Truy cập <strong className="text-[var(--color-text-primary)]">aistudio.google.com</strong> và đăng nhập bằng tài khoản Google bất kỳ.
            </li>
            <li>
              Nhấn nút <strong className="text-[var(--color-text-primary)]">&quot;Get API key&quot;</strong> ở góc trên bên trái, sau đó chọn <strong className="text-[var(--color-text-primary)]">&quot;Create API key&quot;</strong>.
            </li>
            <li>
              Sao chép chuỗi khóa (bắt đầu bằng <code className="px-1 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-[11px]">AIza...</code>) và dán vào ô bên dưới.
            </li>
            <li className="text-emerald-600 dark:text-emerald-400 font-medium">
              Hoàn toàn <strong>100% miễn phí</strong> từ Google, không yêu cầu thẻ tín dụng!
            </li>
          </ol>
        </div>

        {/* Key Input Field */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[var(--color-text-primary)]">
            Google Gemini API Key:
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={geminiKeyInput}
              onChange={(e) => {
                setGeminiKeyInput(e.target.value);
                setTestResult(null);
              }}
              placeholder="Dán khóa API bắt đầu bằng AIzaSy..."
              className="w-full px-4 py-2.5 pr-10 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] focus:border-cyan-500 text-xs font-mono text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]/50 focus:outline-hidden transition-all shadow-xs"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              title={showKey ? 'Ẩn khóa' : 'Hiện khóa'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-1">
            <Info className="w-3 h-3 text-cyan-500 shrink-0" />
            Định dạng hợp lệ: Bắt đầu bằng <span className="font-mono font-semibold">AIza</span> (khoảng 39 ký tự).
          </p>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div
            className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p className="font-semibold">{testResult.message}</p>
              {testResult.model && (
                <p className="text-[10px] opacity-80 font-mono">Mô hình đã kết nối: {testResult.model}</p>
              )}
            </div>
          </div>
        )}

        {/* Save success toast */}
        {saveSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã lưu thành công! Đang kích hoạt...</span>
          </div>
        )}

        {/* Privacy & Zero-leak Guarantee Badge */}
        <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[11px] uppercase tracking-wide">
              Bảo mật tuyệt đối — Zero Common Key Leak
            </p>
            <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
              API Key được lưu <strong>duy nhất trong trình duyệt của bạn</strong> (Client-side localStorage). Máy chủ không bao giờ ghi nhật ký (zero logging), không lưu vào cơ sở dữ liệu và chỉ chuyển tiếp tức thời tới Google trong từng lượt gọi.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={testing || !geminiKeyInput.trim()}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-background)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
            </button>
            {hasExistingKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2.5 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Xóa khóa API khỏi trình duyệt"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xóa</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-xs font-semibold hover:bg-[var(--color-background)] transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!geminiKeyInput.trim()}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu Key</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
