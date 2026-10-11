import asyncio
import time
import random
import json
import uuid
import urllib.robotparser
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from nlp.local_processor import nlp_processor
from crawler.rag_deduplicator import rag_deduplicator
from crawler.media_uploader import upload_media_to_cdn
from db.connection import get_db_cursor
from db.analytics import db_analytics

class HSKWebCrawler:
    def __init__(self, source_name: str, base_url: str, respect_robots_txt: bool = True):
        self.source_name = source_name
        self.base_url = base_url
        self.respect_robots_txt = respect_robots_txt

    def check_robots_allowed(self, target_url: str) -> bool:
        if not self.respect_robots_txt:
            return True
        try:
            parsed = urlparse(target_url)
            robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
            rp = urllib.robotparser.RobotFileParser()
            rp.set_url(robots_url)
            rp.read()
            return rp.can_fetch("*", target_url)
        except Exception:
            return True

    async def crawl_mock_hsk_page(self, target_url: str, hsk_level: str, raw_html_override: str = None):
        job_id = str(uuid.uuid4())
        total_crawled = 0
        total_new = 0
        total_exact_duplicate = 0
        total_semantic_duplicate = 0
        total_errors = 0
        error_logs = []

        # 1. Tạo Job Record trong DB
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute("""
                    INSERT INTO crawl_jobs (id, source, status)
                    VALUES (%s, %s, 'running');
                """, (job_id, self.source_name))
        except Exception as db_err:
            print(f"[DB Notice] Lỗi tạo job log: {db_err}")

        if not raw_html_override and not self.check_robots_allowed(target_url):
            try:
                with get_db_cursor(commit=True) as cur:
                    cur.execute("""
                        UPDATE crawl_jobs 
                        SET status = 'failed', error_log = 'Robots.txt disallow', finished_at = CURRENT_TIMESTAMP
                        WHERE id = %s;
                    """, (job_id,))
            except Exception:
                pass
            print(f"[Crawler Warning] URL {target_url} bị chặn bởi Robots.txt.")
            return

        try:
            # 2. Thu thập nội dung trang (Playwright hoặc override)
            if raw_html_override:
                content = raw_html_override
            else:
                async with async_playwright() as p:
                    browser = await p.chromium.launch(headless=True)
                    page = await browser.new_page()
                    await asyncio.sleep(random.uniform(1.0, 2.5))
                    await page.goto(target_url, timeout=30000, wait_until="domcontentloaded")
                    content = await page.content()
                    await browser.close()

            soup = BeautifulSoup(content, "html.parser")
            question_nodes = soup.select(".question-item")
            if not question_nodes:
                raise ValueError(f"Selector '.question-item' không tìm thấy phần tử nào tại {target_url}.")

            # 3. Lấy tập câu hỏi hiện có trong DB cùng cấp độ để đối chiếu RAG Semantic Deduplication
            existing_questions = []
            try:
                with get_db_cursor() as cur:
                    cur.execute("""
                        SELECT id, hanzi_content, options, content_hash
                        FROM questions
                        WHERE hsk_level = %s;
                    """, (hsk_level,))
                    existing_questions = cur.fetchall()
            except Exception as e:
                print(f"[Crawler Warning] Không tải được questions từ DB: {e}")

            existing_hashes = {q["content_hash"] for q in existing_questions}

            items_to_insert = []
            for node in question_nodes:
                total_crawled += 1
                try:
                    raw_hanzi = node.select_one(".content").get_text(strip=True)
                    simplified_hanzi = nlp_processor.to_simplified(raw_hanzi)
                    pinyin_text = nlp_processor.generate_pinyin(simplified_hanzi)

                    raw_options = [opt.get_text(strip=True) for opt in node.select(".opt")]
                    options = [
                        {"key": chr(65 + i), "text": nlp_processor.to_simplified(opt)}
                        for i, opt in enumerate(raw_options)
                    ]
                    correct_answer = node.select_one(".answer").get_text(strip=True).upper()

                    # Lớp 1: Exact Hash Check
                    c_hash = rag_deduplicator.compute_exact_hash(simplified_hanzi, options, correct_answer)
                    if c_hash in existing_hashes:
                        total_exact_duplicate += 1
                        print(f"  [Trùng lặp Exact Hash] Bỏ qua câu: {simplified_hanzi[:20]}...")
                        continue

                    # Lớp 2: RAG Semantic Similarity Check (với câu hỏi trong DB)
                    is_semantic_dup = False
                    for ext_q in existing_questions:
                        ext_opts = json.loads(ext_q["options"]) if isinstance(ext_q["options"], str) else ext_q["options"]
                        sim_score, classification = rag_deduplicator.check_question_similarity(
                            simplified_hanzi, options,
                            ext_q["hanzi_content"], ext_opts
                        )
                        if classification == "duplicate":
                            total_semantic_duplicate += 1
                            is_semantic_dup = True
                            print(f"  [Trùng lặp RAG Ngữ Nghĩa {int(sim_score*100)}%] Bỏ qua câu tương đồng: {simplified_hanzi[:20]}... khớp với {ext_q['hanzi_content'][:20]}...")
                            break

                    if is_semantic_dup:
                        continue

                    # Upload Media (nếu có)
                    img_node = node.select_one("img")
                    media_url = None
                    if img_node and img_node.get("src"):
                        media_url = upload_media_to_cdn(img_node["src"], "image")

                    # Tạo ID câu hỏi
                    q_id = str(uuid.uuid4())
                    items_to_insert.append((
                        q_id,
                        simplified_hanzi,
                        pinyin_text,
                        json.dumps(options, ensure_ascii=False),
                        correct_answer,
                        hsk_level,
                        'grammar',
                        'multiple_choice',
                        media_url,
                        target_url,
                        c_hash,
                        'pending_review'
                    ))
                    # Thêm vào danh sách đối chiếu tạm thời để dedup nội bộ chính batch này
                    existing_hashes.add(c_hash)
                    existing_questions.append({
                        "id": q_id,
                        "hanzi_content": simplified_hanzi,
                        "options": options,
                        "content_hash": c_hash
                    })

                except Exception as err:
                    total_errors += 1
                    error_logs.append(f"Parse error: {str(err)}")

            # 4. Lưu các câu hỏi mới vào Database
            if items_to_insert:
                with get_db_cursor(commit=True) as cur:
                    for item in items_to_insert:
                        cur.execute("""
                            INSERT INTO questions (
                                id, hanzi_content, pinyin_text, options, correct_answer,
                                hsk_level, topic, question_type, media_url,
                                source_url, content_hash, status
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                        """, item)
                total_new = len(items_to_insert)

            # Cập nhật kết quả file JSON local
            all_crawled_export = []
            try:
                with get_db_cursor() as cur:
                    cur.execute("SELECT * FROM questions ORDER BY crawled_at DESC;")
                    all_crawled_export = cur.fetchall()
                with open("crawled_questions.json", "w", encoding="utf-8") as f:
                    json.dump(all_crawled_export, f, ensure_ascii=False, indent=2)
            except Exception:
                pass

        except Exception as e:
            total_errors += 1
            error_logs.append(f"Crawler Fatal: {str(e)}")

        # 5. Cập nhật kết quả Job & kích hoạt DB Analytics
        try:
            with get_db_cursor(commit=True) as cur:
                cur.execute("""
                    UPDATE crawl_jobs
                    SET finished_at = CURRENT_TIMESTAMP,
                        total_crawled = %s,
                        total_new = %s,
                        total_duplicate = %s,
                        total_semantic_duplicate = %s,
                        total_errors = %s,
                        status = %s,
                        error_log = %s
                    WHERE id = %s;
                """, (
                    total_crawled, total_new, total_exact_duplicate, total_semantic_duplicate, total_errors,
                    'success' if total_errors == 0 else 'partial',
                    "\n".join(error_logs), job_id
                ))
        except Exception as err:
            print(f"[DB Log Error] Không thể update crawl_jobs: {err}")

        # 6. Chạy báo cáo DB Analytics tự động
        try:
            print("\n" + "=" * 50)
            print("📊 ĐANG KÍCH HOẠT PHÂN TÍCH DB VÀ RAG DEDUPLICATION...")
            analytics_report = db_analytics.run_full_corpus_analysis()
            print(f"-> Tổng câu hỏi trong DB: {analytics_report['total_questions_in_db']}")
            print(f"-> Trùng lặp Exact Hash: {analytics_report['exact_duplicate_count']}")
            print(f"-> Cặp tương đồng Ngữ Nghĩa (RAG): {analytics_report['semantic_near_duplicate_pairs']}")
            print(f"-> Tỷ lệ trùng lặp tổng thể: {analytics_report['overall_duplicate_rate_pct']}%")
            print("=" * 50 + "\n")
        except Exception as e:
            print(f"[Analytics Error] Lỗi khi chạy db_analytics: {e}")

        print(f"[CRAWL TỔNG KẾT] Nguồn: {self.source_name} | Cào: {total_crawled} | Mới: {total_new} | Trùng Exact: {total_exact_duplicate} | Trùng RAG: {total_semantic_duplicate} | Lỗi: {total_errors}")
