"""
=============================================================================
HỆ THỐNG RAG & SEMANTIC DEDUPLICATION CHO TÀI LIỆU VÀ ĐỀ THI HSK
=============================================================================
1. Chuẩn hóa Hán tự Giản thể & bóc tách số thứ tự/ký tự nhiễu.
2. Lớp 1: Exact Fingerprint Matching (SHA-256).
3. Lớp 2: Token-level Jaccard & N-gram Cosine Similarity (Jieba segmentation).
4. Lớp 3: RAG Knowledge Base Alignment (Khớp chủ điểm ngữ pháp và chống trùng kho RAG).
"""
import re
import hashlib
import json
from typing import List, Dict, Tuple, Optional
from nlp.local_processor import nlp_processor

class RAGSemanticDeduplicator:
    def __init__(self, semantic_threshold: float = 0.88, variant_threshold: float = 0.70):
        self.semantic_threshold = semantic_threshold
        self.variant_threshold = variant_threshold

    @staticmethod
    def clean_hanzi_stem(text: str) -> str:
        """Loại bỏ số thứ tự câu hỏi như '1.', '一、', '第1题：', 'Q1.' và khoảng trắng thừa."""
        if not text:
            return ""
        simplified = nlp_processor.to_simplified(text)
        # Bỏ prefix câu hỏi dạng 1. / 1、 / 第1题 / Question 1:
        cleaned = re.sub(r'^(?:\d+[\.、\s]+|第\s*\d+\s*题[\s:：]*|Q\d+[\s:：]*|[一二三四五六七八九十]+[\.、\s]+)', '', simplified, flags=re.IGNORECASE)
        return cleaned.strip()

    @staticmethod
    def compute_exact_hash(hanzi_content: str, options: List[Dict], correct_answer: str) -> str:
        """Tạo mã SHA-256 fingerprint sau khi loại bỏ mọi khoảng trắng và chuẩn hóa."""
        stem = re.sub(r'[\s\W_]+', '', RAGSemanticDeduplicator.clean_hanzi_stem(hanzi_content))
        sorted_opts = sorted([re.sub(r'[\s\W_]+', '', opt.get("text", "")) for opt in options])
        raw_key = f"{stem}|{'|'.join(sorted_opts)}|{correct_answer.strip().upper()}"
        return hashlib.sha256(raw_key.encode('utf-8')).hexdigest()

    @staticmethod
    def compute_jaccard_similarity(set_a: set, set_b: set) -> float:
        if not set_a or not set_b:
            return 0.0
        intersection = len(set_a.intersection(set_b))
        union = len(set_a.union(set_b))
        return intersection / union if union > 0 else 0.0

    @staticmethod
    def compute_char_ngram_similarity(text_a: str, text_b: str, n: int = 2) -> float:
        """Tính độ tương đồng qua Bigram ký tự tiếng Trung."""
        def get_ngrams(s: str):
            clean = re.sub(r'[\s\W_]+', '', s)
            if len(clean) < n:
                return {clean} if clean else set()
            return {clean[i:i+n] for i in range(len(clean) - n + 1)}

        ngrams_a = get_ngrams(text_a)
        ngrams_b = get_ngrams(text_b)
        return RAGSemanticDeduplicator.compute_jaccard_similarity(ngrams_a, ngrams_b)

    def calculate_semantic_similarity(self, text_a: str, text_b: str) -> float:
        """
        Kết hợp Token Jaccard (từ vựng qua jieba) và Char Bigram.
        """
        clean_a = self.clean_hanzi_stem(text_a)
        clean_b = self.clean_hanzi_stem(text_b)

        if clean_a == clean_b:
            return 1.0

        tokens_a = set(nlp_processor.tokenize_words(clean_a))
        tokens_b = set(nlp_processor.tokenize_words(clean_b))

        token_sim = self.compute_jaccard_similarity(tokens_a, tokens_b)
        char_sim = self.compute_char_ngram_similarity(clean_a, clean_b, n=2)

        # Trọng số: 60% Token jieba + 40% Char Bigram
        return round(0.6 * token_sim + 0.4 * char_sim, 4)

    def check_question_similarity(
        self,
        new_hanzi: str,
        new_options: List[Dict],
        existing_hanzi: str,
        existing_options: List[Dict]
    ) -> Tuple[float, str]:
        """
        So sánh toàn diện giữa 2 câu hỏi (Stem + Options).
        Trả về (similarity_score, classification).
        """
        stem_sim = self.calculate_semantic_similarity(new_hanzi, existing_hanzi)

        # So sánh độ trùng của các lựa chọn
        opt_texts_new = [re.sub(r'^[A-D][\.\s、]*', '', opt.get("text", "")).strip() for opt in new_options]
        opt_texts_ext = [re.sub(r'^[A-D][\.\s、]*', '', opt.get("text", "")).strip() for opt in existing_options]

        set_new = set([nlp_processor.to_simplified(o) for o in opt_texts_new if o])
        set_ext = set([nlp_processor.to_simplified(o) for o in opt_texts_ext if o])
        opt_sim = self.compute_jaccard_similarity(set_new, set_ext) if (set_new and set_ext) else 0.0

        # Tổng hợp điểm
        total_score = round(0.7 * stem_sim + 0.3 * opt_sim, 4)

        if total_score >= self.semantic_threshold:
            classification = "duplicate"
        elif total_score >= self.variant_threshold:
            classification = "variant"
        else:
            classification = "unique"

        return total_score, classification

    def align_with_rag_knowledge(self, hanzi_content: str, rag_docs: List[Dict]) -> Optional[Dict]:
        """
        RAG Alignment: Đối chiếu câu hỏi với kho tri thức ngữ pháp HSK.
        Tự động xác định chủ điểm liên quan và gắn tham chiếu RAG.
        """
        cleaned_query = self.clean_hanzi_stem(hanzi_content)
        query_tokens = set(nlp_processor.tokenize_words(cleaned_query))

        best_doc = None
        best_score = 0.0

        for doc in rag_docs:
            doc_text = f"{doc.get('title', '')} {doc.get('rulesSummary', '')} {' '.join(doc.get('tags', []))}"
            doc_tokens = set(nlp_processor.tokenize_words(doc_text))
            score = self.compute_jaccard_similarity(query_tokens, doc_tokens)

            # Khớp từ khóa trực tiếp (vd: 把, 被, 得, 地, 的, 比较, 越...越...)
            keywords = ["把", "被", "得", "地", "的", "虽然", "但是", "因为", "所以", "千万", "来得及"]
            for kw in keywords:
                if kw in cleaned_query and kw in doc_text:
                    score += 0.25

            if score > best_score:
                best_score = score
                best_doc = {
                    "doc_id": doc.get("id"),
                    "title": doc.get("title"),
                    "category": doc.get("category"),
                    "relevance_score": round(best_score, 4)
                }

        if best_doc and best_score >= 0.2:
            return best_doc
        return None

rag_deduplicator = RAGSemanticDeduplicator()
