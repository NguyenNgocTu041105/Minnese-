import React, { useState } from 'react';
import {
  X,
  Users,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { joinClassByCode } from '../../lib/firebase';
import { UserProfile } from '../../types';

interface JoinClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onClassJoined: (updatedFields: Partial<UserProfile>) => void;
}

export const JoinClassModal: React.FC<JoinClassModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onClassJoined,
}) => {
  const [classCode, setClassCode] = useState(userProfile.class_code || '');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [joinedClass, setJoinedClass] = useState<any>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) {
      setStatusMsg({ text: 'Vui lòng nhập mã lớp do giáo viên cung cấp.', isError: true });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await joinClassByCode(classCode, userProfile.id);
      setIsLoading(false);
      if (res.success && res.classData) {
        setJoinedClass(res.classData);
        setStatusMsg({ text: res.message, isError: false });
        onClassJoined({
          class_id: res.classData.id,
          class_code: res.classData.class_code,
          current_level: res.classData.hsk_level,
        });
      } else {
        setStatusMsg({ text: res.message, isError: true });
      }
    } catch (err: any) {
      setIsLoading(false);
      setStatusMsg({ text: err?.message || 'Có lỗi xảy ra khi tham gia lớp học.', isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden text-[var(--color-text-primary)]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]/50 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-1">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            Tham gia lớp học của bạn
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Nhập mã lớp do giáo viên hoặc trung tâm cung cấp để nhận bài tập, giáo trình riêng và đồng bộ kết quả học tập.
          </p>
        </div>

        {/* Current Class Info if already in a class */}
        {userProfile.class_code && !joinedClass && (
          <div className="p-3 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs flex items-center justify-between">
            <div>
              <span className="text-[var(--color-text-secondary)]">Lớp hiện tại: </span>
              <span className="font-mono font-bold text-amber-600 ml-1">{userProfile.class_code}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
              Đang tham gia
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
              Mã lớp học (Class Code)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="VD: HSK1-A7X2"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono text-base font-bold focus:outline-none focus:border-[var(--color-primary)] uppercase tracking-wider"
              />
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-1.5">
              Mã ví dụ mẫu có sẵn: <code className="font-mono font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] px-1.5 py-0.5 rounded">HSK1-A7X2</code>
            </p>
          </div>

          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                statusMsg.isError
                  ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-medium'
              }`}
            >
              {statusMsg.isError ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMsg.text}</span>
            </div>
          )}

          {/* Joined Class Card */}
          {joinedClass && (
            <div className="p-3.5 bg-[var(--color-primary-light)]/50 rounded-2xl border border-[var(--color-primary)]/20 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[var(--color-text-primary)]">
                <GraduationCap className="w-4 h-4 text-[var(--color-primary)]" />
                <span>{joinedClass.class_name}</span>
              </div>
              <p className="text-[var(--color-text-secondary)]">
                Giáo viên: <strong className="text-[var(--color-text-primary)]">{joinedClass.teacher_name || 'Cô Lý'}</strong> • Trình độ: <strong className="text-[var(--color-primary)]">HSK {joinedClass.hsk_level}</strong>
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]/30 transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isLoading || !classCode.trim()}
              className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>Xác nhận mã lớp</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
