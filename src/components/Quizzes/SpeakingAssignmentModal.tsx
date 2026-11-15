import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Upload,
  Volume2,
  Send,
  X,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileAudio,
} from 'lucide-react';
import { AssignmentDoc, AssignmentSubmissionDoc, UserProfile } from '../../types';
import { playChineseAudio, stopChineseAudio } from '../../utils/chineseAudio';
import { saveSubmissionToFirestore } from '../../lib/firebase';

interface SpeakingAssignmentModalProps {
  assignment: AssignmentDoc;
  userProfile: UserProfile;
  existingSubmission?: AssignmentSubmissionDoc;
  onClose: () => void;
  onSubmitted: (submission: AssignmentSubmissionDoc) => void;
}

export const SpeakingAssignmentModal: React.FC<SpeakingAssignmentModalProps> = ({
  assignment,
  userProfile,
  existingSubmission,
  onClose,
  onSubmitted,
}) => {
  const [inputTab, setInputTab] = useState<'record' | 'upload'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(existingSubmission?.student_audio_url || '');
  const [mediaMime, setMediaMime] = useState<string>('audio/webm');
  const [isVideoPreview, setIsVideoPreview] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>(existingSubmission?.speaking_transcript || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const promptText =
    assignment.speaking_prompt ||
    assignment.writing_prompt ||
    assignment.description ||
    assignment.title;

  useEffect(() => {
    return () => {
      stopChineseAudio();
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setErrorMsg(null);
    setSubmitSuccess(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      const supportedType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';
      const recorder = supportedType ? new MediaRecorder(stream, { mimeType: supportedType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setMediaMime(recorder.mimeType || supportedType || 'audio/webm');

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setMediaBlob(blob);
        setIsVideoPreview(false);
        setPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);

      // Optional zero-cost browser speech recognition (zh-CN) for instant transcript preview
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.lang = 'zh-CN';
          rec.continuous = true;
          rec.interimResults = true;
          rec.onresult = (event: any) => {
            let combined = '';
            for (let i = 0; i < event.results.length; i++) {
              combined += event.results[i][0].transcript;
            }
            if (combined.trim()) setTranscript(combined.trim());
          };
          rec.onerror = () => {};
          rec.start();
          recognitionRef.current = rec;
        } catch {}
      }
    } catch (err: any) {
      setErrorMsg(
        err?.name === 'NotAllowedError'
          ? 'Trình duyệt chưa được cấp quyền Micro. Vui lòng bật quyền Micro hoặc chuyển sang tab "Tải file lên".'
          : 'Không thể khởi động Micro trên thiết bị này. Bạn có thể chuyển sang tab "Tải file lên".'
      );
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSubmitSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('Dung lượng file vượt quá 20MB. Vui lòng chọn file ghi âm hoặc video ngắn hơn.');
      return;
    }
    setMediaBlob(file);
    setMediaMime(file.type || 'audio/mpeg');
    setIsVideoPreview(file.type.startsWith('video/'));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const handleSubmit = async () => {
    if (!mediaBlob && !existingSubmission?.student_audio_url) {
      setErrorMsg('Vui lòng ghi âm hoặc tải file trước khi nộp bài.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      let uploadedUrl = existingSubmission?.student_audio_url || '';
      if (mediaBlob) {
        const base64Data = await blobToBase64(mediaBlob);
        const res = await fetch('/api/speaking/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Data,
            mimeType: mediaMime,
            assignmentId: assignment.id,
            userId: userProfile.id,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Tải file lên máy chủ thất bại.');
        }
        uploadedUrl = data.url;
      }

      const submissionDoc: AssignmentSubmissionDoc = {
        id: existingSubmission?.id || `sub-spk-${Date.now()}`,
        assignment_id: assignment.id,
        assignment_title: assignment.title,
        user_id: userProfile.id,
        user_name: userProfile.displayName || userProfile.email.split('@')[0],
        user_email: userProfile.email,
        class_id: userProfile.class_id,
        status: 'completed',
        student_audio_url: uploadedUrl,
        student_audio_duration: recordSeconds || existingSubmission?.student_audio_duration || undefined,
        speaking_transcript: transcript || undefined,
        feedback: transcript ? `Bản nhận diện lời nói: "${transcript}"` : 'Học viên đã nộp bài luyện nói/phát âm.',
        submitted_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };

      await saveSubmissionToFirestore(submissionDoc);
      try {
        const localSubs: AssignmentSubmissionDoc[] = JSON.parse(
          localStorage.getItem('minnese_local_submissions') || '[]'
        );
        const filtered = localSubs.filter((s) => s.id !== submissionDoc.id);
        filtered.unshift(submissionDoc);
        localStorage.setItem('minnese_local_submissions', JSON.stringify(filtered.slice(0, 50)));
      } catch {}

      setSubmitSuccess(true);
      onSubmitted(submissionDoc);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi nộp bài nói.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] max-w-2xl w-full rounded-3xl border border-[var(--color-border)] p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] pb-3">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
              🎙️ Bài tập Luyện Nói &amp; Phát âm (HSK {assignment.hsk_level})
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] mt-1">
              {assignment.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reading / Speaking Prompt Card */}
        <div className="p-4 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--color-primary)]">
              Nội dung cần đọc / nói:
            </span>
            <button
              type="button"
              onClick={() => playChineseAudio(promptText)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Nghe mẫu</span>
            </button>
          </div>
          <p className="text-base sm:text-lg font-bold font-chinese text-[var(--color-text-primary)] whitespace-pre-line leading-relaxed">
            {promptText}
          </p>
        </div>

        {/* Mode Switcher: Direct Mic vs Upload */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => setInputTab('record')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              inputTab === 'record'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Ghi âm trực tiếp (Mic)</span>
          </button>
          <button
            type="button"
            onClick={() => setInputTab('upload')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              inputTab === 'upload'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Tải file ghi âm / video</span>
          </button>
        </div>

        {/* Tab Body */}
        {inputTab === 'record' ? (
          <div className="p-5 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background)]/60 flex flex-col items-center justify-center space-y-3 text-center">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 transition-transform hover:scale-105 cursor-pointer"
              >
                <Mic className="w-7 h-7" />
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg animate-pulse cursor-pointer"
              >
                <Square className="w-6 h-6 fill-current" />
              </button>
            )}

            <div className="space-y-0.5">
              <p className="text-xs font-bold text-[var(--color-text-primary)]">
                {isRecording
                  ? `Đang thu âm... (${formatTimer(recordSeconds)})`
                  : mediaBlob
                  ? 'Đã thu âm xong — Nghe lại bên dưới hoặc bấm để thu lại'
                  : 'Bấm nút Mic để bắt đầu đọc (tự động lọc tạp âm)'}
              </p>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                Mẹo: Nếu dùng laptop bị rè, bạn có thể mở trang này trên điện thoại để thu âm trực tiếp hoặc tải file lên.
              </p>
            </div>
          </div>
        ) : (
          <label className="p-5 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-background)]/60 flex flex-col items-center justify-center space-y-2 text-center cursor-pointer hover:border-[var(--color-primary)] transition-colors">
            <FileAudio className="w-8 h-8 text-[var(--color-primary)]" />
            <span className="text-xs font-bold text-[var(--color-text-primary)]">
              Chọn file ghi âm hoặc video ngắn từ máy / điện thoại
            </span>
            <span className="text-[11px] text-[var(--color-text-secondary)]">
              Hỗ trợ .mp3, .m4a, .wav, .ogg, .webm, .mp4 (tối đa 20MB)
            </span>
            <input
              type="file"
              accept="audio/*,video/mp4,video/webm,.m4a,.mp3,.wav"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}

        {/* Preview Player + Optional Browser Speech Transcript */}
        {previewUrl && (
          <div className="p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text-primary)]">
              <span>Bản nghe thử của bạn:</span>
              {mediaBlob && (
                <button
                  type="button"
                  onClick={() => {
                    setMediaBlob(null);
                    setPreviewUrl('');
                    setTranscript('');
                  }}
                  className="text-[11px] text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Xóa làm lại</span>
                </button>
              )}
            </div>
            {isVideoPreview || previewUrl.endsWith('.mp4') ? (
              <video controls src={previewUrl} className="w-full max-h-56 rounded-xl bg-black" />
            ) : (
              <audio controls src={previewUrl} className="w-full h-10" />
            )}
            {transcript && (
              <p className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface)] p-2 rounded-lg border border-[var(--color-border)]">
                <strong className="text-[var(--color-primary)]">Nhận diện sơ bộ (trình duyệt):</strong>{' '}
                <span className="font-chinese">{transcript}</span>
              </p>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {submitSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Đã nộp bài nói thành công! Giáo viên có thể nghe và gửi voice sửa phát âm cho bạn ngay.</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
          >
            {submitSuccess ? 'Đóng' : 'Hủy'}
          </button>
          <button
            type="button"
            disabled={isSubmitting || isRecording || (!mediaBlob && !existingSubmission?.student_audio_url)}
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isSubmitting ? 'Đang tải lên...' : 'Nộp bài nói'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
