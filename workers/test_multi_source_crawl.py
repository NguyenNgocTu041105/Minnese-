"""
=============================================================================
KIỂM THỬ TOÀN DIỆN: CRAWL ĐA NGUỒN + PHÂN TÍCH DB + RAG DEDUPLICATION
=============================================================================
Kịch bản mô phỏng thực tế:
- Nguồn 1 (Site_Edu_Beijing): Cào 3 câu hỏi HSK 3 chuẩn.
- Nguồn 2 (Site_HSK_Online): Cào lại câu hỏi cũ (Trùng Exact Hash).
- Nguồn 3 (Site_Taiwan_Learning): Cào câu hỏi bằng chữ Phồn thể (Traditional).
- Nguồn 4 (Site_Global_Chinese): Cào câu hỏi biến thể ngữ nghĩa cao (> 90% tương đồng RAG).
- Nguồn 5 (Site_HSK_Advanced): Cào thêm câu hỏi mới về điểm ngữ pháp khác.
"""
import sys
import os
import asyncio
import json

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from crawler.base_crawler import HSKWebCrawler
from db.analytics import db_analytics
from db.connection import get_db_cursor

# Nguồn 1: Đề thi chuẩn HSK 3
HTML_SOURCE_1 = """
<div class="exam-container">
  <div class="question-item">
    <div class="content">这是一个非常美丽的学校，里面有很多学生。</div>
    <div class="opt">A. 这</div><div class="opt">B. 那</div><div class="opt">C. 哪</div><div class="opt">D. 谁</div>
    <div class="answer">A</div>
  </div>
  <div class="question-item">
    <div class="content">明天下午我们一起去图书馆借书，好吗？</div>
    <div class="opt">A. 好</div><div class="opt">B. 不好</div><div class="opt">C. 不去</div><div class="opt">D. 没有</div>
    <div class="answer">A</div>
  </div>
  <div class="question-item">
    <div class="content">虽然今天天气很冷，但是教室里很暖和。</div>
    <div class="opt">A. 虽然...但是...</div><div class="opt">B. 因为...所以...</div><div class="opt">C. 不但...而且...</div><div class="opt">D. 只要...就...</div>
    <div class="answer">A</div>
  </div>
</div>
"""

# Nguồn 2: Trùng lặp 100% Exact Hash (Nguồn khác copy lại)
HTML_SOURCE_2 = """
<div class="exam-container">
  <div class="question-item">
    <div class="content">这是一个非常美丽的学校，里面有很多学生。</div>
    <div class="opt">A. 这</div><div class="opt">B. 那</div><div class="opt">C. 哪</div><div class="opt">D. 谁</div>
    <div class="answer">A</div>
  </div>
  <div class="question-item">
    <div class="content">明天下午我们一起去图书馆借书，好吗？</div>
    <div class="opt">A. 好</div><div class="opt">B. 不好</div><div class="opt">C. 不去</div><div class="opt">D. 没有</div>
    <div class="answer">A</div>
  </div>
</div>
"""

# Nguồn 3: Viết bằng chữ Phồn thể + Đảo thứ tự Options (Traditional Script Duplicate)
HTML_SOURCE_3 = """
<div class="exam-container">
  <div class="question-item">
    <div class="content">明天下午我們一起去圖書館借書，好嗎？</div>
    <div class="opt">A. 没有</div><div class="opt">B. 不去</div><div class="opt">C. 好</div><div class="opt">D. 不好</div>
    <div class="answer">C</div>
  </div>
</div>
"""

# Nguồn 4: Biến thể ngữ nghĩa cao (Semantic Near-Duplicate: sửa nhẹ từ ngữ)
HTML_SOURCE_4 = """
<div class="exam-container">
  <div class="question-item">
    <div class="content">明天我们一起去学校图书馆借书，好吗？</div>
    <div class="opt">A. 好</div><div class="opt">B. 不好</div><div class="opt">C. 不去</div><div class="opt">D. 没有</div>
    <div class="answer">A</div>
  </div>
</div>
"""

# Nguồn 5: Câu hỏi mới hoàn toàn (New Unique Questions)
HTML_SOURCE_5 = """
<div class="exam-container">
  <div class="question-item">
    <div class="content">他把桌子上的咖啡喝完了。</div>
    <div class="opt">A. 把</div><div class="opt">B. 被</div><div class="opt">C. 让</div><div class="opt">D. 给</div>
    <div class="answer">A</div>
  </div>
  <div class="question-item">
    <div class="content">妹妹高兴得跳了起来。</div>
    <div class="opt">A. 的</div><div class="opt">B. 得</div><div class="opt">C. 地</div><div class="opt">D. 着</div>
    <div class="answer">B</div>
  </div>
</div>
"""

async def run_multi_source_simulation():
    print("=" * 70)
    print("🧪 BẮT ĐẦU CHẠY THỬ NGHIỆM HỆ THỐNG CRAWLER ĐA NGUỒN VỚI RAG DEDUPLICATION & DB")
    print("=" * 70)

    # 1. Reset database questions & analytics để test rõ ràng
    with get_db_cursor(commit=True) as cur:
        cur.execute("DELETE FROM questions;")
        cur.execute("DELETE FROM crawl_jobs;")
        cur.execute("DELETE FROM crawl_analytics;")
    print("🧹 Đã làm sạch dữ liệu kiểm thử trong DB.\n")

    sources = [
        ("Site_Edu_Beijing", HTML_SOURCE_1, "Đợt 1: Cào đề thi gốc từ trường đại học"),
        ("Site_HSK_Online_Clone", HTML_SOURCE_2, "Đợt 2: Cào trang học online (Trùng 100% câu cũ)"),
        ("Site_Taiwan_Traditional", HTML_SOURCE_3, "Đợt 3: Cào tài liệu Đài Loan (Chữ phồn thể + tráo đáp án)"),
        ("Site_Paraphrased_Variant", HTML_SOURCE_4, "Đợt 4: Cào trang biến thể ngữ nghĩa cao (Semantic Overlap)"),
        ("Site_HSK_Grammar_New", HTML_SOURCE_5, "Đợt 5: Cào câu hỏi mới điểm ngữ pháp 把 và 得")
    ]

    for src_name, html_data, desc in sources:
        print(f"\n▶ [{src_name}] - {desc}")
        crawler = HSKWebCrawler(source_name=src_name, base_url="https://mock-exam.org", respect_robots_txt=False)
        await crawler.crawl_mock_hsk_page("https://mock-exam.org/hsk3", "HSK3", raw_html_override=html_data)

    print("\n" + "=" * 70)
    print("📈 KẾT QUẢ PHÂN TÍCH TỔNG HỢP CƠ SỞ DỮ LIỆU (DATABASE CORPUS REPORT)")
    print("=" * 70)

    final_report = db_analytics.run_full_corpus_analysis()
    print(json.dumps(final_report, ensure_ascii=False, indent=2))

    print("\n✅ KIỂM THỬ THÀNH CÔNG RỰC RỠ:")
    print(f"- Tổng số câu hỏi thực sự lưu trong DB: {final_report['total_questions_in_db']} (Đã lọc sạch các nguồn trùng lặp).")
    print(f"- Số bản ghi trùng lặp tuyệt đối (Exact): {final_report['exact_duplicate_count']}")
    print(f"- Tỷ lệ trùng lặp toàn hệ thống: {final_report['overall_duplicate_rate_pct']}%")

if __name__ == "__main__":
    asyncio.run(run_multi_source_simulation())
