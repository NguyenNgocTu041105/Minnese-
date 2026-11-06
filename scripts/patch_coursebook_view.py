import sys
import re

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

file_path = "src/components/Coursebook/CoursebookView.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add imports
import_lucide_old = "Loader2,\n} from 'lucide-react';"
import_lucide_new = "Loader2,\n  Pause,\n  Sparkles,\n  Radio,\n} from 'lucide-react';"

if import_lucide_old in content:
    content = content.replace(import_lucide_old, import_lucide_new)
elif "Loader2,\r\n} from 'lucide-react';" in content:
    content = content.replace("Loader2,\r\n} from 'lucide-react';", "Loader2,\r\n  Pause,\r\n  Sparkles,\r\n  Radio,\r\n} from 'lucide-react';")

# Add manifest import
manifest_import = "import { COURSEBOOK_AUDIO_MANIFEST } from '../../data/coursebookAudioManifest';"
if manifest_import not in content:
    target_pos = content.find("import { NEW_HSK6_FULL_LESSONS }")
    if target_pos != -1:
        end_of_line = content.find("\n", target_pos) + 1
        content = content[:end_of_line] + manifest_import + "\n" + content[end_of_line:]

# 2. Add LESSON_ILLUSTRATIONS constant before CoursebookView component
illustrations_const = '''
const LESSON_ILLUSTRATIONS: Record<string, { src: string; caption: string }> = {
  'hsk1-l1-t1': {
    src: '/hsk1_lesson1_proper.jpg',
    caption: 'Trong lớp học: Hai người bạn học chào nhau vui vẻ bằng câu "你好！"',
  },
  'hsk1-l1-t2': {
    src: '/hsk1_lesson1_t2_proper.jpg',
    caption: 'Trong văn phòng: Học sinh cúi chào lễ phép "老师，您好！", cô giáo mỉm cười đáp "你们好！"',
  },
};
'''

if "const LESSON_ILLUSTRATIONS" not in content:
    comp_pos = content.find("export const CoursebookView:")
    if comp_pos != -1:
        content = content[:comp_pos] + illustrations_const + "\n" + content[comp_pos:]

# 3. Add audio state & methods inside CoursebookView
state_marker = "const [playingLineId, setPlayingLineId] = useState<string | null>(null);"
new_state = '''const [playingLineId, setPlayingLineId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [activePlayingTextId, setActivePlayingTextId] = useState<string | null>(null);
  const coursebookAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (coursebookAudioRef.current) {
        coursebookAudioRef.current.pause();
        coursebookAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (coursebookAudioRef.current) {
      coursebookAudioRef.current.pause();
      coursebookAudioRef.current = null;
    }
    setActivePlayingTextId(null);
    setPlayingLineId(null);
  }, [selectedLessonIndex, selectedHskLevel, activeTab]);

  const stopAllCoursebookAudio = () => {
    if (coursebookAudioRef.current) {
      coursebookAudioRef.current.pause();
      coursebookAudioRef.current = null;
    }
    setActivePlayingTextId(null);
    setPlayingLineId(null);
  };

  const handleToggleFullAudio = (textId: string, fallbackText: string) => {
    if (activePlayingTextId === textId) {
      stopAllCoursebookAudio();
      return;
    }

    stopAllCoursebookAudio();
    const manifestItem = COURSEBOOK_AUDIO_MANIFEST[textId];
    if (manifestItem?.fullAudioUrl) {
      const audio = new Audio(manifestItem.fullAudioUrl);
      audio.playbackRate = playbackSpeed;
      coursebookAudioRef.current = audio;
      setActivePlayingTextId(textId);

      audio.ontimeupdate = () => {
        const cur = audio.currentTime;
        const currentLine = manifestItem.lineTimings.find(
          (t) => cur >= t.start && cur <= t.end
        );
        if (currentLine) {
          setPlayingLineId(`${textId}-${currentLine.lineIndex}`);
        }
      };

      audio.onended = () => {
        setActivePlayingTextId(null);
        setPlayingLineId(null);
        coursebookAudioRef.current = null;
      };

      audio.onerror = () => {
        setActivePlayingTextId(null);
        setPlayingLineId(null);
        coursebookAudioRef.current = null;
      };

      audio.play().catch(() => {
        stopAllCoursebookAudio();
      });
    } else {
      setActivePlayingTextId(textId);
      playChineseAudio(fallbackText, playbackSpeed);
      setTimeout(() => {
        setActivePlayingTextId(null);
        setPlayingLineId(null);
      }, 4000);
    }
  };

  const handlePlayLineAudio = (textId: string, lineIndex: number, fallbackHanzi: string) => {
    stopAllCoursebookAudio();
    const lineKey = `${textId}-${lineIndex}`;
    setPlayingLineId(lineKey);

    const manifestItem = COURSEBOOK_AUDIO_MANIFEST[textId];
    const lineAudio = manifestItem?.lines?.[lineIndex];

    if (lineAudio?.audioUrl) {
      const audio = new Audio(lineAudio.audioUrl);
      audio.playbackRate = playbackSpeed;
      coursebookAudioRef.current = audio;

      audio.onended = () => {
        setPlayingLineId(null);
        coursebookAudioRef.current = null;
      };

      audio.onerror = () => {
        setPlayingLineId(null);
        coursebookAudioRef.current = null;
      };

      audio.play().catch(() => {
        setPlayingLineId(null);
      });
    } else {
      playChineseAudio(fallbackHanzi, playbackSpeed);
      setTimeout(() => setPlayingLineId(null), 2500);
    }
  };'''

if state_marker in content and "const [playbackSpeed, setPlaybackSpeed]" not in content:
    content = content.replace(state_marker, new_state)

# 4. Replace Tab 1 rendering
old_tab1_regex = r"\{\/\* TAB 1: TEXTS \(BÀI KHÓA\) \*\/\}\s*\{activeTab === 'text' && \(.*?\)\s*\}\s*\{\/\* TAB 2: GRAMMAR"

new_tab1 = '''{/* TAB 1: TEXTS (BÀI KHÓA) */}
          {activeTab === 'text' && (
            <div className="space-y-6">
              {/* Studio Audio Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-xs">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                      Giọng Đọc Studio Neural (Edge-TTS Bắc Kinh)
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Đa vai đối thoại
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--color-text-secondary)]">
                      Phát âm tròn vành rõ chữ • Ngắt nghỉ tự nhiên giữa các nhân vật • Karaoke đồng bộ
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-secondary)] font-medium">Tốc độ:</span>
                  <div className="inline-flex rounded-xl p-0.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setPlaybackSpeed(0.8)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        playbackSpeed === 0.8
                          ? 'bg-rose-500 text-white font-bold shadow-xs'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                      title="Tốc độ 0.8x cho người mới luyện nghe rõ từng thanh điệu"
                    >
                      0.8x Chậm
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaybackSpeed(1.0)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        playbackSpeed === 1.0
                          ? 'bg-rose-500 text-white font-bold shadow-xs'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                      title="Tốc độ 1.0x bản xứ tự nhiên"
                    >
                      1.0x Chuẩn
                    </button>
                  </div>
                </div>
              </div>

              {currentLesson.texts.map((textItem) => {
                const manifest = COURSEBOOK_AUDIO_MANIFEST[textItem.id];
                const illustration = LESSON_ILLUSTRATIONS[textItem.id];
                const isFullPlaying = activePlayingTextId === textItem.id;

                return (
                  <div
                    key={textItem.id}
                    className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 sm:p-6 shadow-xs space-y-5"
                  >
                    {/* Centered Scene Illustration (NO left-right split) */}
                    {illustration && (
                      <div className="w-full max-w-2xl mx-auto overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-sm bg-[var(--color-bg-secondary)]">
                        <div className="relative aspect-video w-full overflow-hidden">
                          <img
                            src={illustration.src}
                            alt={textItem.title}
                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent flex items-end p-4">
                            <p className="text-white text-xs sm:text-sm font-medium drop-shadow-md">
                              {illustration.caption}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Text Header with Title & Full Audio Button */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-[var(--color-text-primary)] font-chinese">
                            {textItem.title}
                          </h3>
                          {manifest && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
                              {manifest.lines.length} lượt thoại
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] italic">
                          {textItem.context}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleFullAudio(
                            textItem.id,
                            textItem.lines.map((l) => `${l.speaker}：${l.hanzi}`).join('。 ')
                          )
                        }
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                          isFullPlaying
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white'
                        }`}
                        title="Nghe toàn bộ hội thoại giữa các nhân vật với ngữ điệu tự nhiên"
                      >
                        {isFullPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            Đang đọc (Bấm để dừng)
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            Nghe toàn đoạn ({playbackSpeed}x)
                          </>
                        )}
                      </button>
                    </div>

                    {/* Dialogue Lines with Persona and Karaoke Highlighting */}
                    <div className="space-y-3 pt-1">
                      {textItem.lines.map((line, lIdx) => {
                        const lineKey = `${textItem.id}-${lIdx}`;
                        const isSpeaking = playingLineId === lineKey;
                        const lineManifest = manifest?.lines?.[lIdx];

                        return (
                          <div
                            key={lineKey}
                            className={`p-4 rounded-xl border transition-all duration-300 flex items-start justify-between gap-4 ${
                              isSpeaking
                                ? 'bg-rose-50/90 border-rose-400 dark:bg-rose-950/40 ring-2 ring-rose-400/40 shadow-sm scale-[1.008]'
                                : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] hover:border-rose-300/60 dark:hover:border-rose-700/50'
                            }`}
                          >
                            <div className="space-y-1.5 flex-1">
                              {/* Speaker & Persona Badge */}
                              <div className="flex items-center gap-2">
                                <span className="text-base select-none">
                                  {lineManifest?.avatar || (lIdx % 2 === 0 ? '👨' : '👩')}
                                </span>
                                <span className="text-xs font-bold text-[var(--color-primary)]">
                                  {line.speaker}
                                </span>
                                {lineManifest?.persona && (
                                  <span className="text-[10px] text-[var(--color-text-secondary)] font-normal px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
                                    {lineManifest.persona}
                                  </span>
                                )}
                                {isSpeaking && (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 animate-pulse ml-auto sm:ml-0">
                                    <Sparkles className="w-3 h-3" />
                                    Đang đọc
                                  </span>
                                )}
                              </div>

                              {/* Hanzi (Chinese Characters) */}
                              <div className="text-lg sm:text-xl font-bold font-chinese text-[var(--color-text-primary)] tracking-wide">
                                {line.hanzi}
                              </div>

                              {/* Pinyin */}
                              <div className="text-xs sm:text-sm font-mono text-[var(--color-primary)]/80 font-medium">
                                {line.pinyin}
                              </div>

                              {/* Vietnamese Translation */}
                              <div className="text-xs text-[var(--color-text-secondary)] pt-0.5">
                                {line.vietnamese}
                              </div>
                            </div>

                            {/* Individual Line Voice Button */}
                            <button
                              type="button"
                              onClick={() => handlePlayLineAudio(textItem.id, lIdx, line.hanzi)}
                              className={`p-2.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer ${
                                isSpeaking
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-[var(--color-surface)] hover:bg-rose-50 hover:text-rose-600 text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                              }`}
                              title={`Luyện nghe câu này (${lineManifest?.persona || 'Giọng nhân vật'})`}
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: GRAMMAR'''

content = re.sub(old_tab1_regex, new_tab1 + " (NGỮ PHÁP", content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully patched CoursebookView.tsx")
