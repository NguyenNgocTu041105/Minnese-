import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  RotateCcw,
  Sparkles,
  Mic,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  FastForward,
} from 'lucide-react';
import { MinnieLogo } from '../MinnieLogo';

interface TeacherVoicePlayerProps {
  voiceUrl: string;
  duration?: number;
  teacherName?: string;
  feedbackText?: string;
  pronunciationNotes?: string[];
  createdAt?: string;
  score?: number;
  assignmentTitle?: string;
}

export const TeacherVoicePlayer: React.FC<TeacherVoicePlayerProps> = ({
  voiceUrl,
  duration = 0,
  teacherName = 'Giáo viên Minnese Chinese',
  feedbackText,
  pronunciationNotes = [],
  createdAt,
  score,
  assignmentTitle,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isStudentPracticing, setIsStudentPracticing] = useState(false);
  const [practiceDone, setPracticeDone] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(voiceUrl);
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [voiceUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((e) => {
          console.error('Audio play error', e);
          setIsPlaying(false);
        });
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalDuration = duration || (audioRef.current?.duration ? Math.floor(audioRef.current.duration) : 15);

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/20 via-[var(--color-surface)] to-[var(--color-surface)] border border-rose-500/30 space-y-4 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center shadow-md shrink-0">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                {teacherName}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold uppercase">
                🎙️ Voice Chữa Phát Âm
              </span>
            </div>
            {assignmentTitle && (
              <p className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                Bài tập: <span className="text-[var(--color-text-primary)]">{assignmentTitle}</span>
              </p>
            )}
          </div>
        </div>

        {score !== undefined && (
          <div className="text-right shrink-0">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 font-extrabold text-xs font-mono">
              {score} Điểm
            </span>
          </div>
        )}
      </div>

      {/* Voice Audio Player Box */}
      <div className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-3 relative z-10 shadow-xs">
        <div className="flex items-center gap-3.5">
          {/* Main Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-md transition-all cursor-pointer shrink-0 ${
              isPlaying
                ? 'bg-rose-700 ring-4 ring-rose-500/20 scale-105'
                : 'bg-rose-600 hover:bg-rose-700 hover:scale-105'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          {/* Progress Wave / Scrubber */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-text-secondary)]">
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {isPlaying ? '▶ Đang nghe lời nhận xét...' : 'Nhấn để nghe Cô sửa âm'}
              </span>
              <span>
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max={totalDuration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-rose-600"
            />
          </div>

          {/* Playback Speed Switcher (0.8x for slow speech, 1.0x normal) */}
          <div className="flex items-center gap-1 shrink-0 bg-[var(--color-surface)] p-1 rounded-lg border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => handleSpeedChange(0.8)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                playbackSpeed === 0.8
                  ? 'bg-rose-600 text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
              title="Nghe chậm (0.8x) để bắt khẩu hình & thanh điệu"
            >
              0.8x
            </button>
            <button
              type="button"
              onClick={() => handleSpeedChange(1.0)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                playbackSpeed === 1.0
                  ? 'bg-rose-600 text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
              title="Tốc độ bình thường (1.0x)"
            >
              1.0x
            </button>
          </div>
        </div>

        {/* Written Teacher Feedback (if any) */}
        {feedbackText && (
          <p className="text-xs text-[var(--color-text-primary)] italic bg-[var(--color-surface)] p-2.5 rounded-lg border border-[var(--color-border)]">
            &quot;{feedbackText}&quot;
          </p>
        )}
      </div>

      {/* Highlighted Pronunciation Tags to Fix */}
      {pronunciationNotes && pronunciationNotes.length > 0 && (
        <div className="space-y-1.5 relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Điểm cần luyện tập & khắc phục:</span>
          </span>

          <div className="flex flex-wrap gap-1.5">
            {pronunciationNotes.map((note, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-[11px] font-medium flex items-center gap-1 shadow-2xs"
              >
                <span>🎯</span>
                <span>{note}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Student Repeat & Practice prompt */}
      <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between gap-3 text-xs">
        <span className="text-[11px] text-[var(--color-text-secondary)]">
          💡 Nghe lại 2-3 lần và nhại theo ngữ điệu chuẩn của cô giáo.
        </span>

        <button
          type="button"
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play();
              setIsPlaying(true);
            }
          }}
          className="px-3 py-1.5 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-bold flex items-center gap-1 text-[11px] transition-all cursor-pointer"
        >
          <RotateCcw className="w-3 h-3 text-rose-500" />
          <span>Nghe lại từ đầu</span>
        </button>
      </div>
    </div>
  );
};
