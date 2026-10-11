import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Plus,
  RefreshCw,
  Eye,
  FileUp,
  HelpCircle,
  BookOpen,
  Scissors,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { extractTextFromPdf, renderPdfPagesToImages, fileToBase64 } from '../../utils/pdfExtractor';
import { getCharPinyinList } from '../../utils/pinyinUtils';

export interface UploadVocabItem {
  hanzi: string;
  pinyin: string;
  hanViet?: string;
  vietnamese: string;
  english?: string;
  hskLevel: number;
  partOfSpeech?: string;
  example?: string;
  exampleTranslation?: string;
}

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportWords: (words: UploadVocabItem[]) => Promise<void> | void;
  onUploadRagFile?: (fileName: string, fileSize: string, contentSummary: string) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onImportWords,
  onUploadRagFile,
}) => {
  const [activeTab, setActiveTab] = useState<'excel' | 'text' | 'manual' | 'rag'>('excel');
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [parsedWords, setParsedWords] = useState<UploadVocabItem[]>([]);
  const [rawText, setRawText] = useState('');
  const [selectedHskLevel, setSelectedHskLevel] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual word state with AI fill helper
  const [manualHanzi, setManualHanzi] = useState('');
  const [manualPinyin, setManualPinyin] = useState('');
  const [manualHanViet, setManualHanViet] = useState('');
  const [manualVietnamese, setManualVietnamese] = useState('');
  const [manualExample, setManualExample] = useState('');
  const [manualExampleTrans, setManualExampleTrans] = useState('');
  const [manualLevel, setManualLevel] = useState(1);
  const [isAiFilling, setIsAiFilling] = useState(false);

  if (!isOpen) return null;

  // Download Sample Excel File for Non-technical users
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        'Chữ Hán (Bắt buộc)': '你好',
        'Pinyin (Phiên âm)': 'nǐ hǎo',
        'Hán Việt': 'nhĩ hảo',
        'Nghĩa tiếng Việt (Bắt buộc)': 'xin chào',
        'Cấp độ HSK (1-6)': 1,
        'Ví dụ tiếng Trung': '你好！很高兴认识你。',
        'Dịch nghĩa ví dụ': 'Xin chào! Rất vui được làm quen với bạn.',
      },
      {
        'Chữ Hán (Bắt buộc)': '谢谢',
        'Pinyin (Phiên âm)': 'xièxie',
        'Hán Việt': 'tạ tạ',
        'Nghĩa tiếng Việt (Bắt buộc)': 'cảm ơn',
        'Cấp độ HSK (1-6)': 1,
        'Ví dụ tiếng Trung': '谢谢你的帮助。',
        'Dịch nghĩa ví dụ': 'Cảm ơn sự giúp đỡ của bạn.',
      },
      {
        'Chữ Hán (Bắt buộc)': '学习',
        'Pinyin (Phiên âm)': 'xuéxí',
        'Hán Việt': 'học tập',
        'Nghĩa tiếng Việt (Bắt buộc)': 'học, học tập',
        'Cấp độ HSK (1-6)': 2,
        'Ví dụ tiếng Trung': '我喜欢学习汉语。',
        'Dịch nghĩa ví dụ': 'Tôi thích học tiếng Trung.',
      },
      {
        'Chữ Hán (Bắt buộc)': '准备',
        'Pinyin (Phiên âm)': 'zhǔnbèi',
        'Hán Việt': 'chuẩn bị',
        'Nghĩa tiếng Việt (Bắt buộc)': 'chuẩn bị',
        'Cấp độ HSK (1-6)': 3,
        'Ví dụ tiếng Trung': '你准备好了吗？',
        'Dịch nghĩa ví dụ': 'Bạn đã chuẩn bị xong chưa?',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tu_Vung_Mau');

    // Auto set column widths for nice layout in Excel
    worksheet['!cols'] = [
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 25 },
      { wch: 16 },
      { wch: 30 },
      { wch: 35 },
    ];

    XLSX.writeFile(workbook, 'Mau_Nhap_Tu_Vung_Tieng_Trung.xlsx');
  };

  // Parse Excel / CSV files
  const processUploadedFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData || jsonData.length === 0) {
          throw new Error('File Excel rỗng hoặc không có dữ liệu ở Sheet đầu tiên.');
        }

        const extracted: UploadVocabItem[] = jsonData
          .map((row) => {
            // Flexible column header mapping for convenience
            const hanzi =
              row['Chữ Hán (Bắt buộc)'] ||
              row['Chữ Hán'] ||
              row['Hanzi'] ||
              row['hanzi'] ||
              row['Từ vựng'] ||
              row['Từ'] ||
              '';
            const pinyin =
              row['Pinyin (Phiên âm)'] ||
              row['Pinyin'] ||
              row['pinyin'] ||
              row['Phiên âm'] ||
              '';
            const hanViet = row['Hán Việt'] || row['hanViet'] || row['han_viet'] || '';
            const vietnamese =
              row['Nghĩa tiếng Việt (Bắt buộc)'] ||
              row['Nghĩa tiếng Việt'] ||
              row['Nghĩa'] ||
              row['vietnamese'] ||
              row['Meaning'] ||
              '';
            const hskLevel = Number(
              row['Cấp độ HSK (1-6)'] ||
                row['HSK'] ||
                row['hskLevel'] ||
                row['Level'] ||
                selectedHskLevel ||
                1
            );
            const example =
              row['Ví dụ tiếng Trung'] || row['Ví dụ'] || row['example'] || '';
            const exampleTrans =
              row['Dịch nghĩa ví dụ'] || row['Dịch ví dụ'] || row['exampleTranslation'] || '';

            return {
              hanzi: String(hanzi).trim(),
              pinyin: String(pinyin).trim(),
              hanViet: String(hanViet).trim(),
              vietnamese: String(vietnamese).trim(),
              hskLevel: isNaN(hskLevel) || hskLevel < 1 || hskLevel > 6 ? 1 : hskLevel,
              example: example ? String(example).trim() : undefined,
              exampleTranslation: exampleTrans ? String(exampleTrans).trim() : undefined,
            };
          })
          .filter((w) => w.hanzi && w.vietnamese);

        if (extracted.length === 0) {
          throw new Error(
            'Không tìm thấy cột Chữ Hán và Nghĩa hợp lệ. Vui lòng tải file mẫu để kiểm tra cấu trúc cột.'
          );
        }

        setParsedWords((prev) => [...prev, ...extracted]);
        setSuccessMessage(`Đã đọc thành công ${extracted.length} từ vựng từ file ${file.name}!`);
      } else if (fileName.endsWith('.csv')) {
        const text = await file.text();
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data as Record<string, any>[];
            const extracted: UploadVocabItem[] = data
              .map((row) => {
                const hanzi =
                  row['Chữ Hán (Bắt buộc)'] ||
                  row['Chữ Hán'] ||
                  row['Hanzi'] ||
                  row['hanzi'] ||
                  row['Từ vựng'] ||
                  '';
                const pinyin = row['Pinyin (Phiên âm)'] || row['Pinyin'] || row['pinyin'] || '';
                const hanViet = row['Hán Việt'] || row['hanViet'] || '';
                const vietnamese =
                  row['Nghĩa tiếng Việt (Bắt buộc)'] ||
                  row['Nghĩa tiếng Việt'] ||
                  row['Nghĩa'] ||
                  row['vietnamese'] ||
                  '';
                const hskLevel = Number(
                  row['Cấp độ HSK (1-6)'] || row['HSK'] || row['hskLevel'] || selectedHskLevel || 1
                );
                const example = row['Ví dụ tiếng Trung'] || row['Ví dụ'] || '';
                const exampleTrans = row['Dịch nghĩa ví dụ'] || row['Dịch ví dụ'] || '';

                return {
                  hanzi: String(hanzi).trim(),
                  pinyin: String(pinyin).trim(),
                  hanViet: String(hanViet).trim(),
                  vietnamese: String(vietnamese).trim(),
                  hskLevel: isNaN(hskLevel) || hskLevel < 1 || hskLevel > 6 ? 1 : hskLevel,
                  example: example ? String(example).trim() : undefined,
                  exampleTranslation: exampleTrans ? String(exampleTrans).trim() : undefined,
                };
              })
              .filter((w) => w.hanzi && w.vietnamese);

            if (extracted.length === 0) {
              setErrorMessage(
                'Không tìm thấy cột Chữ Hán và Nghĩa trong file CSV. Bạn hãy tải file mẫu để xem ví dụ.'
              );
            } else {
              setParsedWords((prev) => [...prev, ...extracted]);
              setSuccessMessage(`Đã đọc thành công ${extracted.length} từ vựng từ file CSV!`);
            }
          },
          error: (err) => {
            setErrorMessage(`Lỗi khi đọc file CSV: ${err.message}`);
          },
        });
      } else if (fileName.endsWith('.pdf')) {
        // PDF parsing with pdfjs-dist
        setPdfProgress({ current: 1, total: 1 });
        let text = '';
        try {
          text = await extractTextFromPdf(file, 150, (current, total) => {
            setPdfProgress({ current, total });
          });
        } catch (pdfErr) {
          console.warn('Text layer extraction warning, checking for scanned images:', pdfErr);
        }

        // Check if digital text layer actually contains Chinese characters
        // (Scanned PDFs often only have Latin scanner watermarks like 'Scanned by...')
        const chineseMatches = text ? (text.match(/[\u4e00-\u9fa5]/g) || []) : [];
        const isScannedOrPhotocopy = !text || text.trim().length < 30 || chineseMatches.length < 15;

        if (isScannedOrPhotocopy) {
          setPdfProgress({ current: 1, total: 15 });
          setSuccessMessage(
            'Phát hiện PDF dạng Scan/Ảnh chụp (không có lớp chữ Hán số). Đang dùng Gemini Vision OCR để quét hình ảnh...'
          );

          // Render PDF pages as crisp images (optimized for speed and payload limits)
          const pageImages = await renderPdfPagesToImages(file, 6, (current, total) => {
            setPdfProgress({ current, total });
          });

          if (pageImages.length === 0) {
            throw new Error('Không thể đọc trang ảnh từ file PDF này.');
          }

          // Call Gemini Multimodal Vision OCR
          const ocrRes = await fetch('/api/ai/ocr-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              images: pageImages,
              targetHsk: selectedHskLevel,
            }),
          });

          if (!ocrRes.ok) {
            const errData = await ocrRes.json().catch(() => ({}));
            throw new Error(
              errData.error ||
                'Hạn ngạch AI Gemini (Free Tier) tạm thời vượt giới hạn. Bạn vui lòng sử dụng tab Tải File Excel (.xlsx) hoặc dán đoạn văn bản trực tiếp để thêm từ vựng.'
            );
          }

          const ocrData = await ocrRes.json();
          setRawText(ocrData.transcribedText || '');
          if (ocrData.words && ocrData.words.length > 0) {
            setParsedWords((prev) => [...prev, ...ocrData.words]);
          }

          setPdfProgress(null);
          setActiveTab('text');
          setSuccessMessage(
            `✨ Gemini Vision OCR đã quét thành công ${pageImages.length} trang PDF Scan! Đã tự động nhận diện và trích xuất ${ocrData.words?.length || 0} từ vựng kèm Pinyin & nghĩa tiếng Việt.`
          );
        } else {
          // Digital PDF with selectable Chinese text
          setRawText(text);
          setPdfProgress(null);

          // Also add to RAG knowledge base if supported
          if (onUploadRagFile) {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            onUploadRagFile(file.name, fileSizeMB, `Giáo trình PDF (${text.slice(0, 150)}...)`);
          }

          if (activeTab === 'rag') {
            setSuccessMessage(`Đã nạp thành công giáo trình PDF "${file.name}" vào Kho RAG của AI Tutor!`);
          } else {
            setActiveTab('text');
            setSuccessMessage(
              `Đã nạp nội dung từ giáo trình PDF "${file.name}". Bấm "🤖 AI Tự động trích xuất" để AI nhận diện toàn bộ từ vựng & Pinyin!`
            );
          }
        }
      } else if (
        fileName.endsWith('.png') ||
        fileName.endsWith('.jpg') ||
        fileName.endsWith('.jpeg') ||
        fileName.endsWith('.webp')
      ) {
        // Direct Image OCR (e.g. photo taken from textbook)
        setSuccessMessage('Đang quét ảnh chụp giáo trình bằng Gemini Vision OCR...');
        const base64Img = await fileToBase64(file);
        
        const ocrRes = await fetch('/api/ai/ocr-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: [base64Img],
            targetHsk: selectedHskLevel,
          }),
        });

        if (!ocrRes.ok) {
          const errData = await ocrRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Lỗi khi AI nhận diện hình ảnh.');
        }

        const ocrData = await ocrRes.json();
        setRawText(ocrData.transcribedText || '');
        if (ocrData.words && ocrData.words.length > 0) {
          setParsedWords((prev) => [...prev, ...ocrData.words]);
        }

        setActiveTab('text');
        setSuccessMessage(
          `✨ Đã quét ảnh chụp "${file.name}" thành công! AI đã nhận diện văn bản và trích xuất ${ocrData.words?.length || 0} từ vựng.`
        );
      } else if (fileName.endsWith('.txt') || fileName.endsWith('.docx')) {
        // Text / Document upload - parse via AI or add to RAG store
        const text = await file.text().catch(() => '');
        if (text && (activeTab === 'text' || activeTab === 'excel')) {
          setRawText(text);
          setActiveTab('text');
          setSuccessMessage(`Đã nạp nội dung file ${file.name}. Hãy bấm nút '🤖 AI Tự động trích xuất' bên dưới.`);
        } else if (onUploadRagFile) {
          const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
          onUploadRagFile(file.name, fileSizeMB, 'Tài liệu giáo trình & bài giảng đã được nạp');
          setSuccessMessage(`Đã tải tài liệu "${file.name}" vào Kho RAG thành công!`);
        }
      } else {
        throw new Error(
          'Định dạng file không hỗ trợ. Vui lòng tải file .pdf (kể cả scan ảnh), ảnh chụp (.jpg, .png), .xlsx, .xls, .csv, hoặc .txt'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã có lỗi xảy ra khi xử lý file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag & Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // AI Extraction for raw pasted text or freeform documents
  const handleAiExtractWords = async () => {
    if (!rawText.trim()) {
      setErrorMessage('Vui lòng nhập hoặc dán đoạn văn bản/danh sách từ vào ô trước.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/ai/extract-vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          targetHsk: selectedHskLevel,
        }),
      });

      if (!response.ok) {
        // Fallback: parse lines locally if offline/endpoint simple
        const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
        const fallbackWords: UploadVocabItem[] = [];

        for (const line of lines) {
          const parts = line.split(/[-–:,|\t]+/).map((s) => s.trim());
          if (parts.length >= 2) {
            fallbackWords.push({
              hanzi: parts[0],
              pinyin: parts.length >= 3 ? parts[1] : '',
              hanViet: '',
              vietnamese: parts.length >= 3 ? parts.slice(2).join(' ') : parts[1],
              hskLevel: selectedHskLevel,
            });
          }
        }

        if (fallbackWords.length > 0) {
          setParsedWords((prev) => [...prev, ...fallbackWords]);
          setSuccessMessage(`Đã trích xuất ${fallbackWords.length} từ từ văn bản của bạn!`);
          setIsProcessing(false);
          return;
        }
        throw new Error('Không thể phân tích tự động. Bạn hãy dán theo định dạng "Chữ Hán - Pinyin - Nghĩa".');
      }

      const result = await response.json();
      if (result.words && Array.isArray(result.words)) {
        setParsedWords((prev) => [...prev, ...result.words]);
        setSuccessMessage(`✨ AI đã trích xuất thành công ${result.words.length} từ vựng từ văn bản!`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi trích xuất từ vựng.');
    } finally {
      setIsProcessing(false);
    }
  };

  // AI Smart Auto-fill for single manual word
  const handleAiAutoFillSingle = async () => {
    if (!manualHanzi.trim()) {
      setErrorMessage('Vui lòng nhập Chữ Hán trước (ví dụ: 学习, 喜欢, 苹果...)');
      return;
    }

    setIsAiFilling(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/word-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hanzi: manualHanzi.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.pinyin) setManualPinyin(data.pinyin);
        if (data.hanViet) setManualHanViet(data.hanViet);
        if (data.vietnamese) setManualVietnamese(data.vietnamese);
        if (data.hskLevel) setManualLevel(data.hskLevel);
        if (data.example) setManualExample(data.example);
        if (data.exampleTranslation) setManualExampleTrans(data.exampleTranslation);
        setSuccessMessage(`✨ Đã tự động điền thông tin cho "${manualHanzi}"!`);
      } else {
        // Simple fallback
        setErrorMessage('Không thể tự động điền, bạn có thể tự gõ Pinyin và Nghĩa.');
      }
    } catch {
      setErrorMessage('Lỗi kết nối khi tra cứu từ AI.');
    } finally {
      setIsAiFilling(false);
    }
  };

  const handleAddManualToList = () => {
    if (!manualHanzi.trim() || !manualVietnamese.trim()) {
      setErrorMessage('Chữ Hán và Nghĩa tiếng Việt không được để trống.');
      return;
    }

    const newWord: UploadVocabItem = {
      hanzi: manualHanzi.trim(),
      pinyin: manualPinyin.trim(),
      hanViet: manualHanViet.trim(),
      vietnamese: manualVietnamese.trim(),
      hskLevel: manualLevel,
      example: manualExample.trim() || undefined,
      exampleTranslation: manualExampleTrans.trim() || undefined,
    };

    setParsedWords((prev) => [newWord, ...prev]);
    setSuccessMessage(`Đã thêm từ "${manualHanzi}" vào danh sách chờ lưu!`);

    // Reset form
    setManualHanzi('');
    setManualPinyin('');
    setManualHanViet('');
    setManualVietnamese('');
    setManualExample('');
    setManualExampleTrans('');
  };

  const handleRemoveParsedWord = (index: number) => {
    setParsedWords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAutoFillMissingInTable = async () => {
    if (parsedWords.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage('Đang tự động bổ sung Hán Việt & Nghĩa tiếng Việt cho các từ...');

    try {
      const updatedWords = [...parsedWords];
      for (let i = 0; i < updatedWords.length; i++) {
        const item = updatedWords[i];
        if (!item.hanViet || !item.vietnamese || item.vietnamese.includes('Từ vựng')) {
          try {
            const res = await fetch('/api/ai/word-lookup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ hanzi: item.hanzi }),
            });
            if (res.ok) {
              const data = await res.json();
              if (data.pinyin && !item.pinyin) item.pinyin = data.pinyin;
              if (data.hanViet) item.hanViet = data.hanViet;
              if (data.vietnamese) item.vietnamese = data.vietnamese;
            }
          } catch {
            // skip item
          }
        }
      }
      setParsedWords(updatedWords);
      setSuccessMessage('✨ Đã hoàn tất bổ sung Hán Việt và Nghĩa tiếng Việt!');
    } catch {
      setErrorMessage('Lỗi khi tự động bổ sung nghĩa.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplitPhrasesToSingleWords = async () => {
    if (parsedWords.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage('Đang bóc tách cụm câu thành các từ đơn chuẩn...');

    try {
      const combinedText = parsedWords.map((w) => w.hanzi).join('，');
      const res = await fetch('/api/ai/extract-vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: combinedText, targetHsk: selectedHskLevel }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.words && Array.isArray(data.words) && data.words.length > 0) {
          setParsedWords(data.words);
          setSuccessMessage(`✨ Đã lọc sạch cụm câu và bóc tách thành ${data.words.length} từ vựng chuẩn!`);
        }
      }
    } catch {
      setErrorMessage('Lỗi khi bóc tách cụm câu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmSaveAll = async () => {
    if (parsedWords.length === 0) {
      setErrorMessage('Chưa có từ nào trong danh sách. Vui lòng tải file hoặc thêm từ trước.');
      return;
    }

    setIsProcessing(true);
    try {
      await onImportWords(parsedWords);
      setParsedWords([]);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu từ vựng vào cơ sở dữ liệu.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-background)]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                Thêm Tài liệu & Nhập Từ vựng Thông Minh
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Hỗ trợ tải file Excel (.xlsx), Word, PDF, dán văn bản tự động phân tích bằng AI hoặc nhập thủ công
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[var(--color-border)] px-5 pt-3 gap-2 bg-[var(--color-surface)] overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('excel');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 shrink-0 ${
              activeTab === 'excel'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Tải File Excel / CSV (.xlsx)
          </button>
          <button
            onClick={() => {
              setActiveTab('text');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 shrink-0 ${
              activeTab === 'text'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            AI Trích xuất Giáo trình PDF / Đoạn văn
          </button>
          <button
            onClick={() => {
              setActiveTab('rag');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 shrink-0 ${
              activeTab === 'rag'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Nạp Giáo trình vào AI Tutor RAG
          </button>
          <button
            onClick={() => {
              setActiveTab('manual');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 shrink-0 ${
              activeTab === 'manual'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Plus className="w-4 h-4" />
            Thêm từng từ (+ AI Gợi ý)
          </button>
        </div>

        {/* Global Hidden File Input for PDF / Excel / Docx / Images */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf, .png, .jpg, .jpeg, .webp, .xlsx, .xls, .csv, .docx, .txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processUploadedFile(e.target.files[0]);
              // Reset value so user can re-upload same file if desired
              e.target.value = '';
            }
          }}
        />

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* PDF Progress Banner */}
          {pdfProgress && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs flex items-center gap-3 animate-pulse">
              <RefreshCw className="w-5 h-5 animate-spin shrink-0" />
              <div>
                <p className="font-bold">Đang đọc & bóc tách trang PDF ({pdfProgress.current}/{pdfProgress.total})...</p>
                <p className="text-[11px] opacity-80">Hệ thống đang trích xuất toàn bộ chữ Hán, ngữ pháp và bài khóa từ giáo trình.</p>
              </div>
            </div>
          )}

          {/* Notifications */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: EXCEL / CSV UPLOAD */}
          {activeTab === 'excel' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)]">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">
                    Bạn chưa có file chuẩn bị sẵn?
                  </span>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    Tải mẫu Excel chuẩn về máy, chỉ cần điền từ vựng và tải lên lại là xong ngay.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-2 shadow-xs transition-colors shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Tải File Mẫu Excel (.xlsx)
                </button>
              </div>

              {/* Drag and drop zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-[0.99]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 bg-[var(--color-background)]/50'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  Kéo thả file Excel / CSV / PDF vào đây hoặc bấm để chọn file
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Hỗ trợ định dạng: <strong>.xlsx, .xls, .csv, .pdf, .docx, .txt</strong>
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: AI TEXT & PDF EXTRACTION */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <FileUp className="w-4 h-4 text-[var(--color-primary)]" />
                    Tải File PDF Giáo trình (Hỗ trợ cả PDF Scan ảnh & Ảnh chụp):
                  </span>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    Tự động nhận diện chữ Hán qua <strong>Gemini Vision OCR</strong> kể cả sách scan, ảnh chụp hoặc file PDF kỹ thuật số.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Chọn File PDF / Scan / Ảnh Chụp
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Nội dung bài học / Giáo trình đã nạp hoặc dán trực tiếp:
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-secondary)]">Cấp HSK mục tiêu:</span>
                  <select
                    value={selectedHskLevel}
                    onChange={(e) => setSelectedHskLevel(Number(e.target.value))}
                    className="px-2.5 py-1 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6].map((lvl) => (
                      <option key={lvl} value={lvl}>
                        HSK {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Dán văn bản giáo trình tiếng Trung hoặc tải file PDF giáo trình ở nút phía trên...\n\nAI sẽ tự động phân tích và tạo danh sách từ vựng chuẩn HSK kèm Pinyin và Nghĩa tiếng Việt chuẩn.`}
                rows={6}
                className="w-full p-3.5 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-[var(--color-primary)] font-chinese leading-relaxed"
              />

              <div className="flex justify-end gap-2">
                {rawText && (
                  <button
                    type="button"
                    onClick={() => setRawText('')}
                    className="px-3 py-2 rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:text-rose-500 transition-colors"
                  >
                    Xóa nội dung
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAiExtractWords}
                  disabled={isProcessing || !rawText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] text-xs font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      AI đang phân tích & trích xuất...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      🤖 AI Phân tích & Trích xuất từ vựng
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: VISUAL MANUAL FORM WITH AI HELPER */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                      Chữ Hán (Hanzi) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ví dụ: 喜欢, 学习, 苹果"
                        value={manualHanzi}
                        onChange={(e) => setManualHanzi(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-chinese font-bold focus:outline-none focus:border-[var(--color-primary)]"
                      />
                      <button
                        type="button"
                        onClick={handleAiAutoFillSingle}
                        disabled={isAiFilling || !manualHanzi.trim()}
                        className="px-3 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50"
                        title="AI tự động tra Pinyin, Nghĩa tiếng Việt và Ví dụ cho từ này"
                      >
                        {isAiFilling ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        AI Tự Điền
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                      Pinyin (Phiên âm có dấu)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: xǐhuan, xuéxí, píngguǒ"
                      value={manualPinyin}
                      onChange={(e) => setManualPinyin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-mono focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                      Âm Hán Việt
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: hỉ hoan, học tập"
                      value={manualHanViet}
                      onChange={(e) => setManualHanViet(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                      Nghĩa tiếng Việt *
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: thích, yêu thích"
                      value={manualVietnamese}
                      onChange={(e) => setManualVietnamese(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                      Cấp độ HSK (1-6)
                    </label>
                    <select
                      value={manualLevel}
                      onChange={(e) => setManualLevel(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-bold focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      {[1, 2, 3, 4, 5, 6].map((l) => (
                        <option key={l} value={l}>
                          HSK {l}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                      Câu ví dụ tiếng Trung (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 我很喜欢喝中国茶。"
                      value={manualExample}
                      onChange={(e) => setManualExample(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-chinese focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                      Dịch nghĩa câu ví dụ (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Tôi rất thích uống trà Trung Quốc."
                      value={manualExampleTrans}
                      onChange={(e) => setManualExampleTrans(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddManualToList}
                    className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm vào danh sách chờ lưu
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RAG DOCUMENTS UPLOAD (PDF / WORD / TXT) */}
          {activeTab === 'rag' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] space-y-2">
                <span className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                  Tải lên Giáo trình / Ngữ pháp / Bài giảng (PDF, Word .docx, .txt)
                </span>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Các tài liệu này sẽ được tự động nạp vào Kho tri thức (Gemini File Search Store) để AI Tutor sử dụng giảng dạy, giải đáp ngữ pháp và tạo đề thi theo đúng giáo trình của trường/trung tâm.
                </p>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-[0.99]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 bg-[var(--color-background)]/50'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mb-3">
                  <FileUp className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  Kéo thả file PDF, DOCX, TXT vào đây hoặc bấm để chọn file
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Tối đa 20MB mỗi file (Hệ thống tự động phân tách đoạn & lập chỉ mục tìm kiếm)
                </p>
              </div>
            </div>
          )}

          {/* PREVIEW OF PARSED WORDS WAITING TO SAVE */}
          {parsedWords.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[var(--color-primary)]" />
                  Danh sách từ vựng đã sẵn sàng lưu ({parsedWords.length} từ):
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSplitPhrasesToSingleWords}
                    disabled={isProcessing}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-[11px] font-bold flex items-center gap-1 transition-colors border border-blue-500/20 cursor-pointer"
                    title="Tách các cụm câu ghép thành từ vựng riêng biệt"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Tách cụm câu thành từ đơn</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAutoFillMissingInTable}
                    disabled={isProcessing}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[11px] font-bold flex items-center gap-1 transition-colors border border-amber-500/20 cursor-pointer"
                    title="Tự động tra cứu và điền Hán Việt & Nghĩa tiếng Việt"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Bổ sung Nghĩa & Hán Việt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setParsedWords([])}
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer ml-1"
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-[var(--color-background)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
                    <tr>
                      <th className="p-2.5 font-semibold">Chữ Hán</th>
                      <th className="p-2.5 font-semibold">Pinyin</th>
                      <th className="p-2.5 font-semibold">Hán Việt</th>
                      <th className="p-2.5 font-semibold">Nghĩa tiếng Việt</th>
                      <th className="p-2.5 font-semibold">Cấp độ</th>
                      <th className="p-2.5 font-semibold text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {parsedWords.map((word, idx) => (
                      <tr key={idx} className="hover:bg-[var(--color-background)]/50">
                        <td className="p-2.5 font-chinese font-bold text-sm text-[var(--color-text-primary)]">
                          {word.hanzi}
                        </td>
                        <td className="p-2.5 font-mono text-[var(--color-primary)]">{word.pinyin || '—'}</td>
                        <td className="p-2.5 text-[var(--color-text-secondary)]">{word.hanViet || '—'}</td>
                        <td className="p-2.5 text-[var(--color-text-primary)] font-medium">{word.vietnamese}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                            HSK {word.hskLevel}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveParsedWord(idx)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-500/10"
                            title="Xóa từ này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-background)]/50 flex items-center justify-between">
          <div className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Dữ liệu sẽ được lưu an toàn và đồng bộ trực tiếp lên Firebase Cloud Firestore.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-semibold hover:bg-[var(--color-background)] transition-colors"
            >
              Đóng
            </button>

            {parsedWords.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmSaveAll}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] text-xs font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang lưu vào Database...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Lưu {parsedWords.length} từ vào Firestore
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
