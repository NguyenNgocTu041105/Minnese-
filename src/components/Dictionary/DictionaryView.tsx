import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Volume2,
  Filter,
  PenTool,
  Layers,
  Sparkles,
  X,
  Check,
  Plus,
  UploadCloud,
  FileText,
  Trash2,
  Download,
  AlertCircle,
  Upload,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Info,
} from 'lucide-react';
import { WordItem, HSKLevel, SRSCardState } from '../../types';
import { getUnifiedVocabularyList, saveOrUpdateWord, saveCustomVocabList, getCustomVocabList } from '../../utils/vocabStorage';
import { playChineseAudio } from '../../utils/chineseAudio';
import { HanziCanvas } from '../HanziCanvas';
import { HanziStrokeStudio } from '../HanziStrokeStudio';
import { formatPartOfSpeechVietnamese } from '../../utils/radicalUtils';
import { DocumentUploadModal } from '../Admin/DocumentUploadModal';

interface DictionaryViewProps {
  srsCards: Record<string, SRSCardState>;
  onAddWordToSRS?: (wordId: string) => void;
  isAuthorizedAdminOrTeacher?: boolean;
}

export const DictionaryView: React.FC<DictionaryViewProps> = ({
  srsCards,
  onAddWordToSRS,
  isAuthorizedAdminOrTeacher = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<HSKLevel | 'all'>('all');
  const [selectedWord, setSelectedWord] = useState<WordItem | null>(null);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [showAddSingleModal, setShowAddSingleModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  // Unified vocabulary list
  const [vocabList, setVocabList] = useState<WordItem[]>(getUnifiedVocabularyList);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState<'batch' | 'single'>('batch');

  const customCount = useMemo(() => getCustomVocabList().length, [vocabList]);

  // Single word form state
  const [singleHanzi, setSingleHanzi] = useState('');
  const [singlePinyin, setSinglePinyin] = useState('');
  const [singleHanViet, setSingleHanViet] = useState('');
  const [singleVietnamese, setSingleVietnamese] = useState('');
  const [singleEnglish, setSingleEnglish] = useState('');
  const [singleLevel, setSingleLevel] = useState<HSKLevel>(1);
  const [singleExampleHanzi, setSingleExampleHanzi] = useState('');
  const [singleExampleTranslation, setSingleExampleTranslation] = useState('');

  // Batch import text state
  const [batchRawText, setBatchRawText] = useState('');
  const [batchLevel, setBatchLevel] = useState<HSKLevel>(1);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Sync vocab on external update
  useEffect(() => {
    const syncVocab = () => {
      setVocabList(getUnifiedVocabularyList());
    };

    window.addEventListener('storage', syncVocab);
    window.addEventListener('minnese_vocab_updated', syncVocab);

    return () => {
      window.removeEventListener('storage', syncVocab);
      window.removeEventListener('minnese_vocab_updated', syncVocab);
    };
  }, []);

  const allVocabularies = vocabList;

  const levelCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (const w of allVocabularies) {
      if (w.hskLevel >= 1 && w.hskLevel <= 6) {
        counts[w.hskLevel] = (counts[w.hskLevel] || 0) + 1;
      }
    }
    return counts;
  }, [allVocabularies]);

  // Helper for accent-insensitive & tone-insensitive search normalization
  const normalizeForSearch = (str: string | undefined | null) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[üǖǘǚǜ]/g, 'u')
      .replace(/v/g, 'u');
  };

  const removeSpecialChars = (str: string) => str.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '');

  // Filter vocabulary based on search query and HSK level
  const filteredWords = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    if (!rawQuery && selectedLevel === 'all') return allVocabularies;

    const normQuery = normalizeForSearch(rawQuery);
    const compactQuery = removeSpecialChars(normQuery);

    return allVocabularies.filter((word) => {
      // HSK Level filter
      if (selectedLevel !== 'all' && word.hskLevel !== selectedLevel) {
        return false;
      }

      if (!rawQuery) return true;

      // 1. Direct Hanzi match
      const hanzi = word.hanzi || '';
      const traditional = word.traditional || '';
      if (hanzi.includes(rawQuery) || (traditional && traditional.includes(rawQuery))) {
        return true;
      }

      // 2. Pinyin match (raw, tone-stripped, or compact)
      const pinyin = word.pinyin || '';
      const pinyinNumbered = word.pinyinNumbered || '';
      const normPinyin = normalizeForSearch(pinyin);
      const compactPinyin = removeSpecialChars(normPinyin);

      if (
        pinyin.toLowerCase().includes(rawQuery) ||
        normPinyin.includes(normQuery) ||
        (compactQuery && compactPinyin.includes(compactQuery)) ||
        (pinyinNumbered && pinyinNumbered.toLowerCase().includes(rawQuery))
      ) {
        return true;
      }

      // 3. Vietnamese & Hán Việt match (accent-insensitive & direct)
      const vietnamese = word.vietnamese || '';
      const hanViet = word.hanViet || '';
      const english = word.english || '';

      const normViet = normalizeForSearch(vietnamese);
      const normHanViet = normalizeForSearch(hanViet);
      const normEng = normalizeForSearch(english);

      const compactViet = removeSpecialChars(normViet);
      const compactHanViet = removeSpecialChars(normHanViet);

      if (
        vietnamese.toLowerCase().includes(rawQuery) ||
        hanViet.toLowerCase().includes(rawQuery) ||
        english.toLowerCase().includes(rawQuery) ||
        normViet.includes(normQuery) ||
        normHanViet.includes(normQuery) ||
        normEng.includes(normQuery) ||
        (compactQuery && (compactViet.includes(compactQuery) || compactHanViet.includes(compactQuery)))
      ) {
        return true;
      }

      // 4. Tags match
      if (word.tags && word.tags.some((t) => normalizeForSearch(t).includes(normQuery))) {
        return true;
      }

      return false;
    });
  }, [allVocabularies, searchQuery, selectedLevel]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLevel, pageSize]);

  const totalPages = Math.ceil(filteredWords.length / pageSize) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedWords = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredWords.slice(startIndex, startIndex + pageSize);
  }, [filteredWords, validCurrentPage, pageSize]);

  const handleAddToSRS = (wordId: string) => {
    if (onAddWordToSRS) {
      onAddWordToSRS(wordId);
    }
    setAddedToast(wordId);
    setTimeout(() => setAddedToast(null), 2500);
  };

  // Add single custom word
  const handleAddSingleWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleHanzi.trim() || !singlePinyin.trim()) return;

    const newWord: WordItem = {
      id: `custom-word-${Date.now()}`,
      hanzi: singleHanzi.trim(),
      pinyin: singlePinyin.trim(),
      hanViet: singleHanViet.trim() || undefined,
      vietnamese: singleVietnamese.trim() || singleEnglish.trim(),
      english: singleEnglish.trim() || singleVietnamese.trim(),
      hskLevel: singleLevel,
      partOfSpeech: 'noun',
      radical: singleHanzi.trim().charAt(0),
      strokeCount: singleHanzi.trim().length * 4,
      examples: singleExampleHanzi.trim()
        ? [
            {
              chinese: singleExampleHanzi.trim(),
              hanzi: singleExampleHanzi.trim(),
              pinyin: '',
              english: singleExampleTranslation.trim() || '',
              vietnamese: singleExampleTranslation.trim() || '',
            },
          ]
        : [],
    };

    saveOrUpdateWord(newWord);
    setVocabList(getUnifiedVocabularyList());
    window.dispatchEvent(new Event('minnese_vocab_updated'));

    // Reset Form
    setSingleHanzi('');
    setSinglePinyin('');
    setSingleHanViet('');
    setSingleVietnamese('');
    setSingleEnglish('');
    setSingleExampleHanzi('');
    setSingleExampleTranslation('');
    setShowAddSingleModal(false);
    setImportStatus(`✨ Đã thêm từ "${newWord.hanzi}" (${newWord.pinyin}) vào từ điển thành công!`);
    setTimeout(() => setImportStatus(null), 4000);
  };

  // Batch import parser: accepts JSON or Line-by-line format
  const handleBatchImport = () => {
    if (!batchRawText.trim()) return;

    try {
      let parsedWords: WordItem[] = [];

      // Check if it's JSON
      if (batchRawText.trim().startsWith('[') || batchRawText.trim().startsWith('{')) {
        const rawJson = JSON.parse(batchRawText);
        const array = Array.isArray(rawJson) ? rawJson : [rawJson];
        parsedWords = array.map((item: any, idx: number) => ({
          id: item.id || `custom-batch-${Date.now()}-${idx}`,
          hanzi: item.hanzi || item.word || '',
          pinyin: item.pinyin || '',
          hanViet: item.hanViet || item.han_viet || '',
          vietnamese: item.vietnamese || item.meaning || item.definition || item.english || '',
          english: item.english || item.vietnamese || '',
          hskLevel: (item.hskLevel || item.hsk_level || batchLevel) as HSKLevel,
          partOfSpeech: item.partOfSpeech || 'noun',
          radical: item.radical || (item.hanzi ? item.hanzi.charAt(0) : ''),
          strokeCount: item.strokeCount || (item.hanzi ? item.hanzi.length * 4 : 5),
          examples: item.examples || [],
        }));
      } else {
        // Parse line by line
        const lines = batchRawText.split('\n');
        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return;

          // Split by |, Tab, or Comma
          const delimiter = trimmed.includes('|') ? '|' : trimmed.includes('\t') ? '\t' : ',';
          const parts = trimmed.split(delimiter).map((p) => p.trim());

          if (parts.length >= 2) {
            const hanzi = parts[0];
            const pinyin = parts[1] || '';
            const vietnamese = parts[2] || parts[1] || '';
            const hanViet = parts[3] || '';

            parsedWords.push({
              id: `custom-batch-${Date.now()}-${idx}`,
              hanzi,
              pinyin,
              hanViet,
              vietnamese,
              english: vietnamese,
              hskLevel: batchLevel,
              partOfSpeech: 'noun',
              radical: hanzi.charAt(0),
              strokeCount: hanzi.length * 4,
              examples: [],
            });
          }
        });
      }

      if (parsedWords.length > 0) {
        const existingList = getCustomVocabList();
        const map = new Map<string, WordItem>();
        parsedWords.forEach((w) => map.set(w.hanzi, w));
        existingList.forEach((w) => {
          if (!map.has(w.hanzi)) {
            map.set(w.hanzi, w);
          }
        });
        saveCustomVocabList(Array.from(map.values()));
        setVocabList(getUnifiedVocabularyList());
        setBatchRawText('');
        setShowImportModal(false);
        setImportStatus(`Đã nạp thành công ${parsedWords.length} từ vựng vào từ điển!`);
        setTimeout(() => setImportStatus(null), 3500);
      } else {
        setImportStatus('Không tìm thấy từ vựng hợp lệ. Vui lòng kiểm tra định dạng dữ liệu.');
      }
    } catch (e: any) {
      setImportStatus(`Lỗi phân tích cú pháp: ${e?.message || 'Định dạng không hợp lệ'}`);
    }
  };

  // Export custom vocabulary as JSON file
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allVocabularies, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `minnese_hsk_dictionary_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6 animate-fade-in" id="dictionary-container">
      {/* Toast Notification */}
      {importStatus && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Search Header */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-5 sm:p-6 border border-[var(--color-border)] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
                  Từ điển HSK & Hanzi Studio
                </h1>
                {isAuthorizedAdminOrTeacher && customCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                    +{customCount} từ tùy chỉnh
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {isAuthorizedAdminOrTeacher
                  ? 'Tra cứu từ vựng HSK 1-6, nghe phát âm, xem thứ tự nét viết, thêm vào bộ nhớ SRS hoặc nạp tài liệu riêng.'
                  : 'Tra cứu từ vựng HSK 1-6, nghe phát âm bản xứ, xem thứ tự nét viết chữ Hán và thêm vào bộ nhớ SRS.'}
              </p>
            </div>
          </div>

          {/* Action Buttons: Thêm từ mới, Đẩy thêm từ điển (Excel/PDF/OCR) & Xuất JSON - Chỉ dành cho Quản trị viên và Giáo viên */}
          {isAuthorizedAdminOrTeacher && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowAddSingleModal(true)}
                className="px-3.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-background)] text-xs font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-primary)] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Thêm 1 từ vựng mới vào từ điển"
                id="btn-add-single-word"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>Thêm 1 từ mới</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="px-3.5 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Đẩy thêm danh sách từ vựng từ Excel, PDF giáo trình hoặc hình ảnh OCR"
                id="btn-upload-document-dictionary"
              >
                <Upload className="w-4 h-4" />
                <span>Đẩy thêm từ điển (Excel / PDF / OCR)</span>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-border)]/30 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Xuất dữ liệu từ điển ra file JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xuất JSON</span>
              </button>
            </div>
          )}
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tra chữ Hán (学习), Pinyin (xuexi), Hán Việt hoặc nghĩa tiếng Việt (học tập, xin chào)..."
            className="silk-input w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm placeholder-[var(--color-text-secondary)]"
          />
        </div>

        {/* Level Filter Chips */}
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)] flex-wrap">
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] font-mono flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Trình độ:
          </span>

          <button
            type="button"
            onClick={() => setSelectedLevel('all')}
            className={`silk-pill px-3 py-1 text-xs font-semibold ${
              selectedLevel === 'all'
                ? 'bg-[var(--color-primary)] text-white font-bold shadow-xs'
                : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
            }`}
          >
            Tất cả ({allVocabularies.length})
          </button>

          {([1, 2, 3, 4, 5, 6] as HSKLevel[]).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevel(lvl)}
              className={`silk-pill px-3 py-1 text-xs font-semibold ${
                selectedLevel === lvl
                  ? 'bg-[var(--color-primary)] text-white font-bold shadow-xs'
                  : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
              }`}
            >
              HSK {lvl} ({levelCounts[lvl] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Pagination & Count Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]">
        <div>
          {filteredWords.length > 0 ? (
            <span>
              Hiển thị <strong className="text-[var(--color-text-primary)]">{(validCurrentPage - 1) * pageSize + 1}</strong> –{' '}
              <strong className="text-[var(--color-text-primary)]">{Math.min(validCurrentPage * pageSize, filteredWords.length)}</strong> trên tổng số{' '}
              <strong className="text-[var(--color-primary)]">{filteredWords.length}</strong> từ vựng
            </span>
          ) : (
            <span>0 từ vựng</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span>Số từ / trang:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="silk-input px-2.5 py-1 text-xs font-semibold"
          >
            <option value={24}>24 từ</option>
            <option value={48}>48 từ</option>
            <option value={96}>96 từ</option>
          </select>
        </div>
      </div>

      {/* Vocabulary Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="vocab-grid">
        {paginatedWords.map((word) => (
          <div
            key={word.id}
            onClick={() => setSelectedWord(word)}
            className="silk-card-interactive rounded-2xl p-4 sm:p-5 flex flex-col justify-between group relative"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl font-bold font-chinese text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                    {word.hanzi}
                  </span>
                  {word.hanViet && (
                    <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                      [{word.hanViet}]
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {word.isCustom && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                      Mới thêm
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 text-[var(--color-primary)] text-[10px] font-mono font-bold">
                    HSK {word.hskLevel}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playChineseAudio(word.hanzi);
                    }}
                    className="p-1 rounded-lg hover:bg-[var(--color-primary-light)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pinyin */}
              <p className="text-xs font-mono font-semibold text-[var(--color-primary)] mt-1.5 tracking-wide">
                {word.pinyin}
              </p>

              <p className="text-xs font-medium text-[var(--color-text-primary)] mt-2 line-clamp-2">
                {word.vietnamese || word.english}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
              <span className="font-medium text-[11px] px-2 py-0.5 rounded-md bg-[var(--color-background)] border border-[var(--color-border)]/60 text-[var(--color-text-secondary)]">
                {formatPartOfSpeechVietnamese(word.partOfSpeech)}
              </span>
              <div 
                title="Xem chi tiết & nét viết Hanzi"
                className="w-6 h-6 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all shadow-2xs group-hover:scale-105"
              >
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls - Centered & Compact with Clear Info */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 pb-2 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-secondary)] font-medium">
            Hiển thị trang <strong className="text-[var(--color-text-primary)]">{validCurrentPage}</strong> trên tổng số <strong className="text-[var(--color-text-primary)]">{totalPages}</strong> trang ({filteredWords.length} từ)
          </p>

          <div className="flex items-center justify-center gap-2">
            {/* Previous Page Button */}
            <button
              type="button"
              disabled={validCurrentPage <= 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              title="Trang trước"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--color-primary)] text-[var(--color-text-primary)] transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Exactly 3 Pages */}
            {(() => {
              let pages: number[] = [];
              if (totalPages <= 3) {
                pages = Array.from({ length: totalPages }, (_, i) => i + 1);
              } else if (validCurrentPage <= 2) {
                pages = [1, 2, 3];
              } else if (validCurrentPage >= totalPages - 1) {
                pages = [totalPages - 2, totalPages - 1, totalPages];
              } else {
                pages = [validCurrentPage - 1, validCurrentPage, validCurrentPage + 1];
              }

              return pages.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    validCurrentPage === page
                      ? 'bg-[var(--color-primary)] text-white shadow-sm ring-2 ring-[var(--color-primary)]/20 scale-105'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-primary)] border border-[var(--color-border)]'
                  }`}
                >
                  {page}
                </button>
              ));
            })()}

            {/* Next Page Button */}
            <button
              type="button"
              disabled={validCurrentPage >= totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              title="Trang sau"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--color-primary)] text-[var(--color-text-primary)] transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {filteredWords.length === 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl p-8 text-center border border-[var(--color-border)] space-y-3">
          <BookOpen className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto opacity-50" />
          <p className="text-sm font-bold text-[var(--color-text-primary)]">
            Không tìm thấy từ vựng phù hợp
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Bạn có thể bấm <strong>"+ Thêm tài liệu / Từ vựng"</strong> ở trên để nạp từ này vào từ điển ngay lập tức.
          </p>
        </div>
      )}

      {/* Hanzi Detail & Stroke Studio Modal (Dual Panel: Left Animation | Right Practice Whiteboard) */}
      {selectedWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="bg-[var(--color-surface)] rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-[var(--color-border)] relative my-auto space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Clean, Spacious Header with Word Identity & Metadata */}
            <div className="border-b border-[var(--color-border)] pb-4 space-y-3.5">
              {/* Row 1: Word + Pinyin + HSK Level + Action Buttons */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
                  <h2 className="text-2xl sm:text-3xl font-bold font-chinese text-[var(--color-text-primary)] tracking-wide leading-none">
                    {selectedWord.hanzi}
                  </h2>
                  <button
                    type="button"
                    onClick={() => playChineseAudio(selectedWord.hanzi)}
                    className="p-1.5 rounded-xl bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors cursor-pointer"
                    title="Phát âm từ vựng"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <span className="text-base sm:text-lg font-bold font-mono text-[var(--color-primary)] leading-none">
                    {selectedWord.pinyin}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20 font-mono font-bold text-xs">
                    HSK {selectedWord.hskLevel}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddToSRS(selectedWord.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                      srsCards[selectedWord.id] || addedToast === selectedWord.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]'
                    }`}
                  >
                    {srsCards[selectedWord.id] || addedToast === selectedWord.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã trong SRS</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-3.5 h-3.5" />
                        <span>Thêm SRS</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedWord(null)}
                    className="p-1.5 rounded-xl bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] transition-colors cursor-pointer"
                    title="Đóng"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Row 2: Meaning & Linguistics Metadata Tags */}
              <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
                <div className="px-2.5 py-1 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] flex items-center gap-1.5">
                  <span className="text-[11px] opacity-70">Nghĩa:</span>
                  <strong className="text-[var(--color-text-primary)] text-xs font-semibold">
                    {selectedWord.vietnamese || selectedWord.english}
                  </strong>
                </div>

                {selectedWord.hanViet && (
                  <div className="px-2.5 py-1 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] flex items-center gap-1.5">
                    <span className="text-[11px] opacity-70">Hán Việt:</span>
                    <strong className="text-[var(--color-text-primary)] text-xs font-semibold">
                      {selectedWord.hanViet}
                    </strong>
                  </div>
                )}

                {selectedWord.partOfSpeech && (
                  <div className="px-2.5 py-1 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] flex items-center gap-1.5">
                    <span className="text-[11px] opacity-70">Loại từ:</span>
                    <strong className="text-[var(--color-text-primary)] text-xs font-semibold">
                      {formatPartOfSpeechVietnamese(selectedWord.partOfSpeech)}
                    </strong>
                  </div>
                )}

                {selectedWord.radical && (
                  <div className="px-2.5 py-1 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)] flex items-center gap-1.5">
                    <span className="text-[11px] opacity-70">Bộ thủ:</span>
                    <strong className="text-[var(--color-primary)] text-xs font-semibold">
                      {selectedWord.radical}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* DUAL-PANEL STROKE ORDER STUDIO */}
            <HanziStrokeStudio
              word={selectedWord}
              isFavorited={Boolean(srsCards[selectedWord.id])}
              onFavoriteToggle={() => handleAddToSRS(selectedWord.id)}
            />

            {/* Example Sentences */}
            {selectedWord.examples && selectedWord.examples.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                <span className="text-xs font-bold text-[var(--color-text-primary)]">
                  Câu ví dụ ngữ cảnh:
                </span>
                <div className="space-y-2">
                  {selectedWord.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-chinese font-bold text-sm text-[var(--color-text-primary)]">
                          {ex.hanzi || ex.chinese}
                        </p>
                        <button
                          type="button"
                          onClick={() => playChineseAudio(ex.hanzi || ex.chinese)}
                          className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] p-1 rounded-lg hover:bg-[var(--color-surface)]"
                          title="Nghe phát âm câu ví dụ"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {ex.pinyin && (
                        <p className="text-xs font-mono text-[var(--color-primary)]">{ex.pinyin}</p>
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
      )}

      {/* SMART DOCUMENT & VOCABULARY UPLOAD MODAL */}
      <DocumentUploadModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportWords={(newWords) => {
          const formatted: WordItem[] = newWords.map((w, idx) => ({
            id: `custom-import-${Date.now()}-${idx}`,
            hanzi: w.hanzi,
            pinyin: w.pinyin,
            hanViet: w.hanViet,
            vietnamese: w.vietnamese,
            english: w.vietnamese,
            hskLevel: (w.hskLevel as HSKLevel) || 1,
            partOfSpeech: 'noun',
            radical: w.hanzi.charAt(0),
            strokeCount: w.hanzi.length * 4,
            examples: w.example
              ? [
                  {
                    chinese: w.example,
                    hanzi: w.example,
                    pinyin: '',
                    vietnamese: w.exampleTranslation || '',
                    english: w.exampleTranslation || '',
                  },
                ]
              : [],
          }));
          const existingList = getCustomVocabList();
          const map = new Map<string, WordItem>();
          formatted.forEach((w) => map.set(w.hanzi, w));
          existingList.forEach((w) => {
            if (!map.has(w.hanzi)) {
              map.set(w.hanzi, w);
            }
          });
          saveCustomVocabList(Array.from(map.values()));
          setVocabList(getUnifiedVocabularyList());
          setImportStatus(`Đã nạp thành công ${formatted.length} từ vựng mới vào từ điển!`);
          setTimeout(() => setImportStatus(null), 4000);
        }}
      />

      {/* MODAL: THÊM 1 TỪ VỰNG MỚI VÀO TỪ ĐIỂN */}
      {showAddSingleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  Thêm từ vựng mới vào Từ Điển
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSingleModal(false)}
                className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSingleWord} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Chữ Hán (Hanzi) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 学习"
                    value={singleHanzi}
                    onChange={(e) => setSingleHanzi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm font-chinese font-bold focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Pinyin (Phiên âm) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: xuéxí"
                    value={singlePinyin}
                    onChange={(e) => setSinglePinyin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-sm font-mono focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Hán Việt
                  </label>
                  <input
                    type="text"
                    placeholder="VD: học tập"
                    value={singleHanViet}
                    onChange={(e) => setSingleHanViet(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Cấp độ HSK
                  </label>
                  <select
                    value={singleLevel}
                    onChange={(e) => setSingleLevel(Number(e.target.value) as HSKLevel)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-semibold focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    {[1, 2, 3, 4, 5, 6].map((l) => (
                      <option key={l} value={l}>
                        HSK {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Nghĩa tiếng Việt *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: học, học tập"
                  value={singleVietnamese}
                  onChange={(e) => setSingleVietnamese(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Câu ví dụ chữ Hán (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: 我喜欢学习汉语。"
                  value={singleExampleHanzi}
                  onChange={(e) => setSingleExampleHanzi(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-chinese focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Dịch nghĩa câu ví dụ
                </label>
                <input
                  type="text"
                  placeholder="VD: Tôi thích học tiếng Hán."
                  value={singleExampleTranslation}
                  onChange={(e) => setSingleExampleTranslation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSingleModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]/50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-all cursor-pointer shadow-xs"
                >
                  Lưu vào Từ Điển
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
