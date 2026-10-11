import React from 'react';
import {
  Volume2,
  Layers,
  Check,
  X,
  BookOpen,
  Sparkles,
  PenTool,
} from 'lucide-react';
import { WordItem, SRSCardState, HSKStoryVocabulary, HSKLevel, ExampleSentence } from '../../types';
import { playChineseAudio } from '../../utils/chineseAudio';
import { HanziStrokeStudio } from '../HanziStrokeStudio';
import { formatPartOfSpeechVietnamese } from '../../utils/radicalUtils';
import { getUnifiedVocabularyList } from '../../utils/vocabStorage';
import { pinyin as getPinyinPro } from 'pinyin-pro';

export interface WordDetailModalProps {
  word: WordItem | HSKStoryVocabulary | null;
  isOpen: boolean;
  onClose: () => void;
  srsCards?: Record<string, SRSCardState>;
  onAddWordToSRS?: (wordId: string) => void;
  contextSentence?: {
    hanzi: string;
    pinyin?: string;
    vietnamese?: string;
  };
}

/**
 * Converts any word or reading vocabulary into a complete, rich WordItem
 * backed by the unified HSK dictionary if available.
 */
export function buildCompleteWordItem(
  vocab: WordItem | HSKStoryVocabulary | string,
  contextSentence?: { hanzi: string; pinyin?: string; vietnamese?: string }
): WordItem {
  const hanzi = typeof vocab === 'string' ? vocab : vocab.hanzi || '';
  const allDictWords = getUnifiedVocabularyList();
  const foundInDict = allDictWords.find((w) => w.hanzi === hanzi);

  const rawPinyin = typeof vocab !== 'string' ? vocab.pinyin : '';
  const rawHanViet = typeof vocab !== 'string' ? (vocab as any).hanViet : '';
  const rawVietnamese = typeof vocab !== 'string' ? vocab.vietnamese : '';
  const rawPos = typeof vocab !== 'string' ? vocab.partOfSpeech : '';
  const rawHsk = typeof vocab !== 'string' ? vocab.hskLevel : 1;

  const generatedPinyin = getPinyinPro(hanzi, { toneType: 'symbol' });

  // Build merged examples
  const examples: ExampleSentence[] = [];

  if (contextSentence && contextSentence.hanzi) {
    examples.push({
      chinese: contextSentence.hanzi,
      hanzi: contextSentence.hanzi,
      pinyin: contextSentence.pinyin || getPinyinPro(contextSentence.hanzi, { toneType: 'symbol' }) || '',
      vietnamese: contextSentence.vietnamese || '',
      english: contextSentence.vietnamese || '',
    });
  }

  if (foundInDict?.examples && foundInDict.examples.length > 0) {
    foundInDict.examples.forEach((ex) => {
      if (!examples.some((e) => e.chinese === (ex.chinese || ex.hanzi))) {
        examples.push({
          chinese: ex.chinese || ex.hanzi || '',
          hanzi: ex.hanzi || ex.chinese || '',
          pinyin: ex.pinyin || getPinyinPro(ex.chinese || ex.hanzi || '', { toneType: 'symbol' }) || '',
          english: ex.english || ex.vietnamese || '',
          vietnamese: ex.vietnamese || ex.english || '',
        });
      }
    });
  }

  return {
    id: foundInDict?.id || `vocab-modal-${hanzi}`,
    hanzi: hanzi,
    pinyin: foundInDict?.pinyin || rawPinyin || generatedPinyin,
    pinyinNumbered: foundInDict?.pinyinNumbered || '',
    hanViet: foundInDict?.hanViet || rawHanViet || '',
    vietnamese: foundInDict?.vietnamese || rawVietnamese || foundInDict?.english || '',
    english: foundInDict?.english || rawVietnamese || '',
    partOfSpeech: foundInDict?.partOfSpeech || rawPos || 'Từ vựng',
    hskLevel: (foundInDict?.hskLevel || rawHsk || 1) as HSKLevel,
    radical: foundInDict?.radical || hanzi.charAt(0),
    strokeCount: foundInDict?.strokeCount || hanzi.length * 4,
    examples: examples,
    audioUrl: foundInDict?.audioUrl,
    traditional: foundInDict?.traditional,
  };
}

export const WordDetailModal: React.FC<WordDetailModalProps> = ({
  word,
  isOpen,
  onClose,
  srsCards = {},
  onAddWordToSRS,
  contextSentence,
}) => {
  if (!isOpen || !word) return null;

  const fullWord = buildCompleteWordItem(word, contextSentence);
  const isSavedInSRS = Boolean(srsCards[fullWord.id] || srsCards[fullWord.hanzi]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 md:p-8 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      id="modal-word-detail-dictionary"
    >
      <div className="bg-[var(--color-surface)] rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-[var(--color-border)] relative my-auto space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header with Word Identity, Pinyin, HSK & Action Buttons */}
        <div className="border-b border-[var(--color-border)] pb-4 space-y-3.5">
          {/* Row 1: Word + Pinyin + Audio + Badges */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
              <h2 className="text-3xl sm:text-4xl font-bold font-chinese text-[var(--color-text-primary)] tracking-wide leading-none">
                {fullWord.hanzi}
              </h2>
              <button
                type="button"
                onClick={() => playChineseAudio(fullWord.hanzi)}
                className="p-2 rounded-xl bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors cursor-pointer shadow-xs"
                title="Phát âm từ vựng"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <span className="text-base sm:text-xl font-bold font-mono text-[var(--color-primary)] leading-none">
                {fullWord.pinyin}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20 font-mono font-bold text-xs">
                HSK {fullWord.hskLevel}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onAddWordToSRS && (
                <button
                  type="button"
                  onClick={() => onAddWordToSRS(fullWord.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                    isSavedInSRS
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]'
                  }`}
                >
                  {isSavedInSRS ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã lưu Flashcards</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-3.5 h-3.5" />
                      <span>Lưu Flashcards</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 2: Linguistics Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <div className="px-3 py-1 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] flex items-center gap-1.5">
              <span className="text-[11px] opacity-70">Nghĩa tiếng Việt:</span>
              <strong className="text-[var(--color-text-primary)] text-xs font-bold">
                {fullWord.vietnamese || fullWord.english}
              </strong>
            </div>

            {fullWord.hanViet && (
              <div className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <span className="text-[11px] opacity-70">Hán Việt:</span>
                <strong className="text-xs font-bold font-mono">
                  {fullWord.hanViet}
                </strong>
              </div>
            )}

            {fullWord.partOfSpeech && (
              <div className="px-3 py-1 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <span className="text-[11px] opacity-70">Từ loại:</span>
                <strong className="text-[var(--color-text-primary)] text-xs font-semibold">
                  {formatPartOfSpeechVietnamese(fullWord.partOfSpeech)}
                </strong>
              </div>
            )}

            {fullWord.radical && (
              <div className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <span className="text-[11px] opacity-70">Bộ thủ:</span>
                <strong className="text-xs font-bold font-chinese">
                  {fullWord.radical}
                </strong>
              </div>
            )}

            <div className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Tập viết từng nét chữ Hán (Hanzi Writer)</span>
            </div>
          </div>
        </div>

        {/* DUAL-PANEL STROKE ORDER STUDIO (Animated SVG Left | Practice Whiteboard Right) */}
        <div className="space-y-2">
          <HanziStrokeStudio
            word={fullWord}
            isFavorited={isSavedInSRS}
            onFavoriteToggle={() => onAddWordToSRS && onAddWordToSRS(fullWord.id)}
          />
        </div>

        {/* Example Sentences in Context */}
        {fullWord.examples && fullWord.examples.length > 0 && (
          <div className="space-y-2.5 pt-3 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-primary)]">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Câu ví dụ minh họa ngữ cảnh:</span>
            </div>
            <div className="space-y-2">
              {fullWord.examples.map((ex, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-chinese font-bold text-sm sm:text-base text-[var(--color-text-primary)]">
                      {ex.hanzi || ex.chinese}
                    </p>
                    <button
                      type="button"
                      onClick={() => playChineseAudio(ex.hanzi || ex.chinese)}
                      className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] p-1.5 rounded-lg hover:bg-[var(--color-surface)] transition-colors cursor-pointer shrink-0"
                      title="Nghe câu ví dụ"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  {ex.pinyin && (
                    <p className="text-xs font-mono text-amber-600 dark:text-amber-400 font-medium">
                      {ex.pinyin}
                    </p>
                  )}
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {ex.vietnamese || ex.english}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
