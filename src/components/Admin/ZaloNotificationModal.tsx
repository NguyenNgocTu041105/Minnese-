import React, { useState } from 'react';
import {
  X,
  Copy,
  Share2,
  MessageCircle,
  ExternalLink,
  Check
} from 'lucide-react';
import { AssignmentDoc, ClassDoc, UserProfile } from '../../types';

interface ZaloNotificationModalProps {
  assignment: AssignmentDoc;
  classes: ClassDoc[];
  students: UserProfile[];
  onClose: () => void;
}

export const ZaloNotificationModal: React.FC<ZaloNotificationModalProps> = ({
  assignment,
  classes,
  onClose,
}) => {
  const targetClass = classes.find((c) => c.id === assignment.target_class_id);
  const className = targetClass ? targetClass.class_name : `Khối HSK ${assignment.hsk_level}`;

  const [copied, setCopied] = useState(false);
  const [customTeacherNote, setCustomTeacherNote] = useState('');

  // Direct app link - points directly to the exam / assignment
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://minnese.app';
  const targetTab = assignment.content_type === 'quiz' ? 'quizzes' : assignment.content_type === 'deck' ? 'flashcards' : 'dashboard';
  const examQuery = assignment.exam_code ? `&exam=${assignment.exam_code}` : '';
  const assignmentLink = `${currentOrigin}/?tab=${targetTab}&assignment=${assignment.id}${examQuery}`;

  const dueDateFormatted = new Date(assignment.due_date).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const contentTypeLabel =
    assignment.content_type === 'quiz'
      ? `${assignment.question_count || 10} câu trắc nghiệm`
      : assignment.content_type === 'deck'
      ? `${assignment.vocab_words?.length || 15} từ vựng SRS`
      : `Bài đọc hiểu HSK`;

  // Concise Zalo Notification Message
  const displayMessage = `📢 [MINNESE] BÀI TẬP MỚI: ${assignment.title}
🎯 Dạng bài: ${contentTypeLabel}
🏷️ Lớp / Khối: ${className}
⏳ Hạn nộp: ${dueDateFormatted}${customTeacherNote ? `\n💬 Lưu ý: ${customTeacherNote}` : ''}

👉 BẤM VÀO ĐÂY ĐỂ LÀM BÀI TRỰC TIẾP TRÊN ĐIỆN THOẠI:
🔗 ${assignmentLink}`;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(displayMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenZaloWeb = () => {
    handleCopyMessage();
    window.open('https://chat.zalo.me/', '_blank');
  };

  const handleMobileShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bài tập: ${assignment.title}`,
          text: displayMessage,
          url: assignmentLink,
        });
      } catch (err) {
        console.log('Share dismissed', err);
      }
    } else {
      handleCopyMessage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-blue-600/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs font-bold text-xs">
              Zalo
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">
                Thông Báo Zalo Lớp Học
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Gửi vào nhóm lớp để học viên làm bài trực tiếp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
              Ghi chú thêm của giáo viên (tùy chọn):
            </label>
            <input
              type="text"
              value={customTeacherNote}
              onChange={(e) => setCustomTeacherNote(e.target.value)}
              placeholder="VD: Các em nhớ làm trước 22:00 nhé!"
              className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                Nội dung tin nhắn gửi vào Nhóm Zalo:
              </label>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                {displayMessage.length} ký tự
              </span>
            </div>
            <pre className="p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] whitespace-pre-wrap font-sans leading-relaxed">
              {displayMessage}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="px-3.5 py-2 rounded-xl bg-[var(--color-background)] hover:bg-[var(--color-border)]/40 border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-blue-500" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép'}</span>
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={handleMobileShare}
                className="px-3.5 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Chia sẻ</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] transition-colors cursor-pointer"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handleOpenZaloWeb}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Mở Zalo Web</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
