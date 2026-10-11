"""
=============================================================================
HỆ THỐNG PHÂN TÍCH CƠ SỞ DỮ LIỆU & BÁO CÁO TRÙNG LẶP (DB ANALYTICS)
=============================================================================
Thực hiện phân tích toàn diện ngân hàng câu hỏi và lịch sử thu thập dữ liệu:
- Tính tỷ lệ trùng lặp theo nguồn (Source Duplicate Rate)
- Phát hiện cụm câu hỏi trùng lặp đa nguồn (Cross-source Duplicate Clusters)
- Thống kê tỷ lệ phân bổ HSK và RAG Topic
- Ghi nhận lịch sử phân tích vào DB (PostgreSQL / SQLite)
"""
import uuid
import json
from typing import Dict, List, Any
from db.connection import get_db_cursor
from crawler.rag_deduplicator import rag_deduplicator

class DBAnalyticsService:
    def __init__(self):
        pass

    def run_full_corpus_analysis(self) -> Dict[str, Any]:
        """
        Quét và phân tích toàn bộ ngân hàng câu hỏi trong cơ sở dữ liệu.
        Tìm kiếm các câu hỏi trùng lặp chính xác và tương đồng ngữ nghĩa.
        """
        with get_db_cursor() as cur:
            cur.execute("""
                SELECT id, hanzi_content, options, correct_answer, hsk_level, 
                       topic, source_url, content_hash, status, crawled_at
                FROM questions
                ORDER BY crawled_at ASC;
            """)
            questions = cur.fetchall()

            cur.execute("""
                SELECT id, source, total_crawled, total_new, total_duplicate, 
                       total_semantic_duplicate, total_errors, status, started_at
                FROM crawl_jobs
                ORDER BY started_at DESC;
            """)
            crawl_jobs = cur.fetchall()

        total_questions = len(questions)
        
        # 1. Phân tích cụm trùng lặp & tương đồng ngữ nghĩa
        exact_hash_map: Dict[str, List[Dict]] = {}
        for q in questions:
            h = q["content_hash"]
            if h not in exact_hash_map:
                exact_hash_map[h] = []
            exact_hash_map[h].append(q)

        exact_duplicate_clusters = [cluster for cluster in exact_hash_map.values() if len(cluster) > 1]
        total_exact_duplicate_count = sum(len(c) - 1 for c in exact_duplicate_clusters)

        # 2. Phân tích tương đồng ngữ nghĩa (Near-duplicate) giữa các câu khác hash
        unique_canonical_questions = [cluster[0] for cluster in exact_hash_map.values()]
        semantic_duplicate_pairs = []
        
        # Kiểm tra theo cặp (giới hạn lấy mẫu để đảm bảo hiệu năng cao)
        sample_size = min(len(unique_canonical_questions), 200)
        sample_pool = unique_canonical_questions[:sample_size]

        for i in range(len(sample_pool)):
            for j in range(i + 1, len(sample_pool)):
                q_a = sample_pool[i]
                q_b = sample_pool[j]

                # Nếu cùng cấp HSK, so sánh
                if q_a["hsk_level"] == q_b["hsk_level"]:
                    opts_a = json.loads(q_a["options"]) if isinstance(q_a["options"], str) else q_a["options"]
                    opts_b = json.loads(q_b["options"]) if isinstance(q_b["options"], str) else q_b["options"]
                    
                    sim_score, classification = rag_deduplicator.check_question_similarity(
                        q_a["hanzi_content"], opts_a,
                        q_b["hanzi_content"], opts_b
                    )

                    if classification in ("duplicate", "variant"):
                        semantic_duplicate_pairs.append({
                            "question_a_id": str(q_a["id"]),
                            "question_a_hanzi": q_a["hanzi_content"],
                            "question_b_id": str(q_b["id"]),
                            "question_b_hanzi": q_b["hanzi_content"],
                            "similarity_score": sim_score,
                            "classification": classification,
                            "hsk_level": q_a["hsk_level"]
                        })

        # 3. Phân tích theo Nguồn (Source Distribution)
        source_stats: Dict[str, Dict[str, Any]] = {}
        for job in crawl_jobs:
            src = job.get("source") or "Unknown"
            if src not in source_stats:
                source_stats[src] = {
                    "total_crawled": 0,
                    "total_new": 0,
                    "total_exact_duplicates": 0,
                    "total_semantic_duplicates": 0,
                    "total_errors": 0
                }
            source_stats[src]["total_crawled"] += job.get("total_crawled", 0)
            source_stats[src]["total_new"] += job.get("total_new", 0)
            source_stats[src]["total_exact_duplicates"] += job.get("total_duplicate", 0)
            source_stats[src]["total_semantic_duplicates"] += job.get("total_semantic_duplicate", 0)
            source_stats[src]["total_errors"] += job.get("total_errors", 0)

        # Tính tỷ lệ trùng lặp phần trăm theo nguồn
        source_summary = []
        for src, data in source_stats.items():
            crawled = data["total_crawled"]
            dups = data["total_exact_duplicates"] + data["total_semantic_duplicates"]
            rate = round((dups / crawled * 100), 2) if crawled > 0 else 0.0
            source_summary.append({
                "source": src,
                "total_crawled": crawled,
                "total_new": data["total_new"],
                "total_duplicates": dups,
                "duplicate_rate_pct": rate
            })

        # 4. Phân bổ theo Cấp độ HSK
        hsk_distribution: Dict[str, int] = {}
        for q in questions:
            lvl = q.get("hsk_level", "HSK3")
            hsk_distribution[lvl] = hsk_distribution.get(lvl, 0) + 1

        overall_duplicate_rate = 0.0
        if total_questions > 0:
            overall_duplicate_rate = round(
                (total_exact_duplicate_count + len(semantic_duplicate_pairs)) / (total_questions + total_exact_duplicate_count) * 100, 2
            )

        report = {
            "total_questions_in_db": total_questions,
            "unique_content_hashes": len(exact_hash_map),
            "exact_duplicate_count": total_exact_duplicate_count,
            "semantic_near_duplicate_pairs": len(semantic_duplicate_pairs),
            "overall_duplicate_rate_pct": overall_duplicate_rate,
            "hsk_distribution": hsk_distribution,
            "source_analytics": source_summary,
            "sample_semantic_duplicates": semantic_duplicate_pairs[:10]
        }

        # Lưu bản ghi phân tích vào bảng crawl_analytics
        self._record_analytics_to_db(report)

        return report

    def _record_analytics_to_db(self, report: Dict[str, Any]):
        """Ghi nhận dữ liệu phân tích định kỳ vào cơ sở dữ liệu."""
        try:
            with get_db_cursor(commit=True) as cur:
                analytics_id = str(uuid.uuid4())
                cur.execute("""
                    INSERT INTO crawl_analytics (
                        id, source, hsk_level, total_crawled, exact_duplicates,
                        semantic_duplicates, net_unique, duplicate_rate
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                """, (
                    analytics_id,
                    "Global Corpus",
                    "ALL",
                    report["total_questions_in_db"] + report["exact_duplicate_count"],
                    report["exact_duplicate_count"],
                    report["semantic_near_duplicate_pairs"],
                    report["unique_content_hashes"],
                    report["overall_duplicate_rate_pct"]
                ))
        except Exception as e:
            print(f"[DB Analytics Warning] Không thể ghi nhận log analytics: {e}")

db_analytics = DBAnalyticsService()
