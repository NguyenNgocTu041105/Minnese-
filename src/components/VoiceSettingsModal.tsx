import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Play,
  Check,
  Sparkles,
  RotateCcw,
  X,
  Gauge,
  Music,
  Info,
  Radio,
  Cpu,
  Loader2,
} from 'lucide-react';
import {
  getAvailableChineseVoices,
  getSavedVoiceSettings,
  saveVoiceSettings,
  playChineseAudio,
  stopChineseAudio,
  VoiceOption,
  VoiceSettings,
  DEFAULT_VOICE_SETTINGS,
  GEMINI_AI_VOICES,
} from '../utils/chineseAudio';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_SENTENCES = [
  { label: 'Chào hỏi cơ bản', text: '你好！很高兴认识你。' },
  { label: 'Học tập HSK', text: '敏思中文，帮助你轻松掌握普通话发音。' },
  { label: 'Giao tiếp đời sống', text: '请问，这个多少钱？' },
];

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({ isOpen, onClose }) => {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [settings, setSettings] = useState<VoiceSettings>(getSavedVoiceSettings());
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [sampleIndex, setSampleIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSettings(getSavedVoiceSettings());
      getAvailableChineseVoices().then((v) => {
        setVoices(v);
      });
    } else {
      stopChineseAudio();
      setIsPlaying(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectVoice = (voiceId: string) => {
    const isAi = voiceId.startsWith('gemini-');
    const updated = saveVoiceSettings({
      voiceId,
      preferNeuralAI: isAi,
      userExplicitlySelectedAiVoice: isAi,
    });
    setSettings(updated);
  };

  const handleRateChange = (rate: number) => {
    const updated = saveVoiceSettings({ rate });
    setSettings(updated);
  };

  const handlePitchChange = (pitch: number) => {
    const updated = saveVoiceSettings({ pitch });
    setSettings(updated);
  };

  const handleReset = () => {
    const updated = saveVoiceSettings(DEFAULT_VOICE_SETTINGS);
    setSettings(updated);
  };

  const handleTestVoice = async (voiceId?: string) => {
    const targetText = SAMPLE_SENTENCES[sampleIndex].text;
    const testVoiceId = voiceId || settings.voiceId;
    setIsPlaying(testVoiceId);

    // Save temporary settings for audition
    if (voiceId) {
      saveVoiceSettings({ voiceId });
      setSettings((prev) => ({ ...prev, voiceId }));
    }

    try {
      await playChineseAudio(targetText, settings.rate, settings.pitch);
    } finally {
      setIsPlaying(null);
    }
  };

  const studioAIVoices = voices.filter((v) => v.isAIStudio);
  const deviceVoices = voices.filter((v) => !v.isAIStudio);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        id="voice-settings-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-background)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-xs">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                Tùy chọn Giọng đọc Tiếng Trung
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Studio Neural AI
                </span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Tự động kết nối Studio Neural AI & Trình duyệt bản xứ cho phát âm mượt mà
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopChineseAudio();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Audition Player & Sample Selector */}
          <div className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Câu mẫu nghe thử
              </span>
              <div className="flex gap-1">
                {SAMPLE_SENTENCES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSampleIndex(idx)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all ${
                      sampleIndex === idx
                        ? 'bg-[var(--color-primary)] text-white shadow-xs'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-sm font-chinese font-bold text-[var(--color-text-primary)]">
                  {SAMPLE_SENTENCES[sampleIndex].text}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTestVoice()}
                disabled={isPlaying !== null}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isPlaying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-white" />
                )}
                <span>{isPlaying ? 'Đang đọc...' : 'Nghe thử'}</span>
              </button>
            </div>
          </div>

          {/* Section 1: Studio Neural AI Voices */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Giọng Đọc Studio Neural AI (Khuyên Dùng)
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Tự nhiên như người thật
              </span>
            </div>

            <div className="space-y-2">
              {studioAIVoices.map((v) => {
                const isSelected = settings.voiceId === v.id || (settings.voiceId === 'default' && v.id === 'gemini-kore');
                const isCurrentlyPlaying = isPlaying === v.id;

                return (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVoice(v.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-[var(--color-text-primary)] ring-1 ring-emerald-500'
                        : 'bg-[var(--color-background)] border-[var(--color-border)] hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-xs ${
                          v.gender === 'female'
                            ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                            : 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                        }`}
                      >
                        {v.gender === 'female' ? '👩' : '👨'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--color-text-primary)]">{v.name}</span>
                          {isSelected && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white">
                              Đang dùng
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--color-text-secondary)]">{v.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestVoice(v.id);
                        }}
                        disabled={isPlaying !== null}
                        className="p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-emerald-500 hover:border-emerald-500/40 transition-colors disabled:opacity-50"
                        title="Nghe thử giọng này"
                      >
                        {isCurrentlyPlaying ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                      </button>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Browser Local Voices */}
          {deviceVoices.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-[var(--color-border)]">
              <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center justify-between">
                <span>Giọng Đọc Tích Hợp Trên Trình Duyệt & Thiết Bị ({deviceVoices.length})</span>
              </label>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {deviceVoices.map((v) => {
                  const isSelected = settings.voiceId === v.id;
                  const isCurrentlyPlaying = isPlaying === v.id;

                  return (
                    <div
                      key={v.id}
                      onClick={() => handleSelectVoice(v.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[var(--color-primary-light)]/40 border-[var(--color-primary)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-primary)]'
                          : 'bg-[var(--color-background)] border-[var(--color-border)] hover:border-slate-400/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            v.gender === 'female'
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          }`}
                        >
                          {v.gender === 'female' ? '👩' : '👨'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-[var(--color-text-primary)]">{v.name}</span>
                            {isSelected && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[var(--color-primary)] text-white">
                                Đang dùng
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[var(--color-text-secondary)]">{v.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestVoice(v.id);
                          }}
                          disabled={isPlaying !== null}
                          className="p-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-emerald-500 hover:border-emerald-500/40 transition-colors disabled:opacity-50"
                          title="Nghe thử giọng này"
                        >
                          {isCurrentlyPlaying ? (
                            <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                          ) : (
                            <Play className="w-3 h-3 fill-current" />
                          )}
                        </button>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Speed (Rate) & Pitch Adjustment Controls */}
          <div className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-4">
            {/* Speed Rate Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-emerald-500" />
                  Tốc độ phát âm (Speed Rate):
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {settings.rate}x {settings.rate < 0.85 ? '(Chậm cho sơ cấp)' : settings.rate > 1.0 ? '(Nhanh)' : '(Chuẩn)'}
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.3"
                step="0.05"
                value={settings.rate}
                onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-[var(--color-text-secondary)] font-mono">
                <span>0.5x (Rất chậm)</span>
                <span>0.85x (Khuyên dùng)</span>
                <span>1.0x (Tự nhiên)</span>
                <span>1.3x (Nhanh)</span>
              </div>
            </div>

            {/* Pitch Adjustment Slider */}
            <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-blue-500" />
                  Cao độ âm thanh (Pitch):
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {settings.pitch.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.1"
                value={settings.pitch}
                onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-[var(--color-text-secondary)] font-mono">
                <span>0.7 (Trầm ấm)</span>
                <span>1.0 (Tiêu chuẩn)</span>
                <span>1.3 (Trong trẻo)</span>
              </div>
            </div>
          </div>

          {/* Info tip */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <p className="leading-relaxed text-[11px]">
              <strong>Công nghệ AI:</strong> Khi chọn các giọng Studio Neural AI (<em>Kore, Zephyr, Puck, Charon</em>), hệ thống sẽ đọc tiếng Trung với ngữ điệu và phát âm chuẩn xác nhất. Bộ nhớ tạm thời (Cache) sẽ lưu âm thanh đã phát để các lần nghe tiếp theo phát ngay tức thì!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-background)]">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopChineseAudio();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Hoàn tất & Lưu
          </button>
        </div>
      </div>
    </div>
  );
};
