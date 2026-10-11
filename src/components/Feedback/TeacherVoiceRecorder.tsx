import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Upload,
  Volume2,
  CheckCircle2,
  Trash2,
  Sparkles,
  AlertCircle,
  Tag,
} from 'lucide-react';

interface TeacherVoiceRecorderProps {
  initialVoiceUrl?: string;
  initialDuration?: number;
  initialNotes?: string[];
  onSaveVoice: (voiceUrl: string, duration: number, notes: string[]) => void;
  onRemoveVoice?: () => void;
}

const COMMON_PRONUNCIATION_TAGS = [
  'Thanh 1 kéo đều cao',
  'Thanh 3 hạ sâu & lên nhẹ',
  'Thanh 4 dứt khoát',
  'Bật hơi c/ch/q',
  'Uốn lưỡi zh/ch/sh/r',
  'Âm mặt lưỡi j/q/x',
  'Khẩu hình tròn môi ü',
  'Âm mũi an/ang/en/eng',
  'Biến điệu 不 (bù/bú)',
  'Biến điệu 一 (yī/yí/yì)',
  'Biến điệu 2 thanh 3 (3+3 -> 2+3)',
  'Ngắt nhịp câu tự nhiên',
];

export const TeacherVoiceRecorder: React.FC<TeacherVoiceRecorderProps> = ({
  initialVoiceUrl,
  initialDuration = 0,
  initialNotes = [],
  onSaveVoice,
  onRemoveVoice,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(initialVoiceUrl || null);
  const [recordingDuration, setRecordingDuration] = useState<number>(initialDuration || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [selectedNotes, setSelectedNotes] = useState<string[]>(initialNotes || []);
  const [customNote, setCustomNote] = useState('');
  const [recordError, setRecordError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync when initialVoiceUrl changes
  useEffect(() => {
    if (initialVoiceUrl) {
      setRecordedAudioUrl(initialVoiceUrl);
      setRecordingDuration(initialDuration || 0);
      setSelectedNotes(initialNotes || []);
    }
  }, [initialVoiceUrl, initialDuration, initialNotes]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
    };
  }, []);

  const startRecording = async () => {
    setRecordError(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setRecordedAudioUrl(base64data);
          onSaveVoice(base64data, recordingDuration, selectedNotes);
        };

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error starting audio recording:', err);
      setRecordError('Không thể truy cập Micro. Vui lòng cấp quyền Micro trong trình duyệt hoặc tải file âm thanh lên.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const handleTogglePlay = () => {
    if (!recordedAudioUrl) return;

    if (!audioElementRef.current) {
      const audio = new Audio(recordedAudioUrl);
      audioElementRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setPlaybackProgress(0);
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPlaybackProgress((audio.currentTime / audio.duration) * 100);
        }
      };
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play().catch((e) => console.error('Audio play error', e));
      setIsPlaying(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result as string;
      setRecordedAudioUrl(base64Audio);
      setRecordingDuration(15); // default placeholder duration if not read
      onSaveVoice(base64Audio, 15, selectedNotes);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setRecordedAudioUrl(null);
    setRecordingDuration(0);
    setIsPlaying(false);
    setPlaybackProgress(0);
    if (onRemoveVoice) onRemoveVoice();
  };

  const toggleNote = (note: string) => {
    const updated = selectedNotes.includes(note)
      ? selectedNotes.filter((n) => n !== note)
      : [...selectedNotes, note];
    setSelectedNotes(updated);
    if (recordedAudioUrl) {
      onSaveVoice(recordedAudioUrl, recordingDuration, updated);
    }
  };

  const handleAddCustomNote = () => {
    if (!customNote.trim()) return;
    const updated = [...selectedNotes, customNote.trim()];
    setSelectedNotes(updated);
    setCustomNote('');
    if (recordedAudioUrl) {
      onSaveVoice(recordedAudioUrl, recordingDuration, updated);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-primary)]/30 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
              Thu âm Voice Chấm & Chữa Phát Âm của Giáo Viên
            </h4>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              Học viên sẽ nghe trực tiếp trên ứng dụng để sửa khẩu hình và thanh điệu
            </p>
          </div>
        </div>

        {recordedAudioUrl && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            Đã có file Voice ({formatTime(recordingDuration)})
          </span>
        )}
      </div>

      {recordError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{recordError}</span>
        </div>
      )}

      {/* Recording / Playing Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
        {!isRecording && !recordedAudioUrl ? (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={startRecording}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Mic className="w-4 h-4" />
              <span>Bắt đầu Thu âm Voice</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1.5 transition-all cursor-pointer"
              title="Tải lên file ghi âm từ máy (.mp3, .m4a, .wav, .webm)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải file</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : isRecording ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600"></span>
              </span>
              <span className="text-xs font-mono font-bold text-rose-600">
                Đang ghi âm: {formatTime(recordingDuration)}
              </span>
            </div>

            <button
              type="button"
              onClick={stopRecording}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Hoàn tất ghi âm</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full flex-wrap gap-3">
            {/* Audio Player Preview */}
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 transition-all cursor-pointer shrink-0"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)] font-mono">
                  <span>{isPlaying ? 'Đang phát...' : 'Bản thu của Cô'}</span>
                  <span>{formatTime(recordingDuration)}</span>
                </div>
                <div className="w-full bg-[var(--color-border)] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-600 h-full transition-all duration-150"
                    style={{ width: `${playbackProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Re-record & delete buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startRecording}
                className="px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-all cursor-pointer"
                title="Ghi âm lại bản khác"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Thu lại</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                className="p-2 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 text-xs transition-all cursor-pointer"
                title="Xóa bản thu"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pronunciation Error Quick Tags Checklist */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-rose-500" />
          <span>Gắn thẻ các điểm cần lưu ý phát âm cho học sinh (Click để chọn):</span>
        </label>

        <div className="flex flex-wrap gap-1.5">
          {COMMON_PRONUNCIATION_TAGS.map((tag) => {
            const isSelected = selectedNotes.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleNote(tag)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-xs font-bold'
                    : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-rose-400 hover:text-[var(--color-text-primary)]'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}
                {tag}
              </button>
            );
          })}
        </div>

        {/* Add custom pronunciation note */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomNote())}
            placeholder="Thêm lưu ý riêng (VD: từ 苹果 đọc nhẹ âm guǒ)..."
            className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-rose-500"
          />
          <button
            type="button"
            onClick={handleAddCustomNote}
            className="px-3 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-xs font-bold text-[var(--color-text-primary)] cursor-pointer"
          >
            Thêm
          </button>
        </div>
      </div>
    </div>
  );
};
