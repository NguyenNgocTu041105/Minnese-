"""
=============================================================================
CRITICAL ARCHITECTURE RULE:
TOÀN BỘ CÁC BƯỚC DƯỚI ĐÂY CHẠY OFFLINE 100% BẰNG THƯ VIỆN LOCAL.
TUYỆT ĐỐI KHÔNG GỌI BẤT KỲ AI/LLM API NÀO TẠI ĐÂY ĐỂ TRÁNH PHÁT SINH CHI PHÍ.
=============================================================================
"""
import opencc
from pypinyin import pinyin, Style
import jieba

class LocalChineseNLP:
    def __init__(self):
        # Bộ chuyển đổi Phồn thể (Traditional) -> Giản thể (Simplified) chuẩn HSK
        try:
            self.t2s_converter = opencc.OpenCC('t2s')
        except Exception:
            self.t2s_converter = opencc.OpenCC('t2s.json')

    def to_simplified(self, text: str) -> str:
        """Chuyển đổi văn bản sang chữ Hán Giản thể chuẩn."""
        if not text:
            return ""
        return self.t2s_converter.convert(text.strip())

    def generate_pinyin(self, text: str) -> str:
        """
        Sinh pinyin đầy đủ dấu thanh điệu, ghép từ chính xác (heteronyms aware).
        Output dạng: wǒ shì xué shēng
        """
        if not text:
            return ""
        simplified = self.to_simplified(text)
        # Style.TONE: dấu thanh điệu chuẩn tiếng Trung (ā, á, ǎ, à)
        pinyin_list = pinyin(simplified, style=Style.TONE, heteronym=False)
        return " ".join([item[0] for item in pinyin_list])

    def tokenize_words(self, text: str) -> list[str]:
        """Tách từ vựng tiếng Trung phục vụ trích xuất tạo Flashcard."""
        if not text:
            return []
        simplified = self.to_simplified(text)
        return [w.strip() for w in jieba.cut(simplified) if len(w.strip()) > 1]

nlp_processor = LocalChineseNLP()
