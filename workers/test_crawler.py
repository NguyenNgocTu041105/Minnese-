import sys
import os
import json
import asyncio

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from nlp.local_processor import nlp_processor
from crawler.deduplicator import compute_content_hash
from crawler.media_uploader import upload_media_to_cdn

MOCK_HTML = """
<!DOCTYPE html>
<html lang="zh">
<head><meta charset="UTF-8"><title>HSK 3 Mock Exam Test Page</title></head>
<body>
  <div class="exam-container">
    <div class="question-item">
      <div class="content">這是一個非常美麗的學校，裡面有很多學生。</div>
      <div class="opt">A. 這</div>
      <div class="opt">B. 那</div>
      <div class="opt">C. 哪</div>
      <div class="opt">D. 誰</div>
      <div class="answer">A</div>
    </div>
    <div class="question-item">
      <div class="content">明天下午我們一起去圖書館借書，好嗎？</div>
      <div class="opt">A. 好</div>
      <div class="opt">B. 不好</div>
      <div class="opt">C. 不去</div>
      <div class="opt">D. 沒有</div>
      <div class="answer">A</div>
    </div>
    <div class="question-item">
      <div class="content">雖然今天天氣很冷，但是教室裡很暖和。</div>
      <div class="opt">A. 雖然...但是...</div>
      <div class="opt">B. 因為...所以...</div>
      <div class="opt">C. 不但...而且...</div>
      <div class="opt">D. 只要...就...</div>
      <div class="answer">A</div>
    </div>
  </div>
</body>
</html>
"""

async def test_crawler_pipeline(target_url: str = None, hsk_level: str = "HSK3"):
    print("=" * 60)
    print(f"🚀 BẮT ĐẦU KIỂM THỬ PIPELINE CRAWLER HSK ({hsk_level})")
    print("=" * 60)

    items = []
    
    async with async_playwright() as p:
        print("[1/5] Đang khởi tạo Playwright Chromium Headless...")
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        if target_url and target_url.startswith("http"):
            print(f"[2/5] Đang truy cập URL: {target_url}")
            await page.goto(target_url, timeout=30000, wait_until="domcontentloaded")
            content = await page.content()
        else:
            print("[2/5] Đang nạp trang HTML HSK Mock Exam mẫu...")
            await page.set_content(MOCK_HTML)
            content = await page.content()

        await browser.close()
        print("[2/5] Đã tải xong nội dung DOM HTML thành công.")

    print("[3/5] Đang bóc tách dữ liệu với BeautifulSoup...")
    soup = BeautifulSoup(content, "html.parser")
    question_nodes = soup.select(".question-item")
    print(f"    -> Tìm thấy {len(question_nodes)} câu hỏi (.question-item)")

    print("[4/5] Đang xử lý NLP (Giản thể + Pinyin) & Deduplication (SHA-256)...")
    for idx, node in enumerate(question_nodes, 1):
        raw_hanzi = node.select_one(".content").get_text(strip=True)
        simplified_hanzi = nlp_processor.to_simplified(raw_hanzi)
        pinyin_text = nlp_processor.generate_pinyin(simplified_hanzi)

        raw_options = [opt.get_text(strip=True) for opt in node.select(".opt")]
        options = [
            {"key": chr(65 + i), "text": nlp_processor.to_simplified(opt)}
            for i, opt in enumerate(raw_options)
        ]
        correct_answer = node.select_one(".answer").get_text(strip=True).upper()

        img_node = node.select_one("img")
        media_url = None
        if img_node and img_node.get("src"):
            media_url = upload_media_to_cdn(img_node["src"], "image")

        content_hash = compute_content_hash(simplified_hanzi, options, correct_answer)

        question_obj = {
            "index": idx,
            "original_hanzi": raw_hanzi,
            "simplified_hanzi": simplified_hanzi,
            "pinyin": pinyin_text,
            "options": options,
            "correct_answer": correct_answer,
            "hsk_level": hsk_level,
            "media_url": media_url,
            "content_hash": content_hash,
            "status": "pending_review"
        }
        items.append(question_obj)
        print(f"    [{idx}] {simplified_hanzi}")
        print(f"        Pinyin: {pinyin_text}")
        print(f"        Đáp án: {correct_answer} | Hash: {content_hash[:12]}...")

    print(f"[5/5] Đang xuất dữ liệu ra file 'crawled_questions.json'...")
    output_path = os.path.join(os.path.dirname(__file__), "..", "crawled_questions.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

    print(f"✅ HOÀN TẤT! Đã cào và chuẩn hóa thành công {len(items)} câu hỏi.")
    print(f"    File lưu tại: {os.path.abspath(output_path)}")
    print("=" * 60)

if __name__ == "__main__":
    url_arg = sys.argv[1] if len(sys.argv) > 1 else None
    level_arg = sys.argv[2] if len(sys.argv) > 2 else "HSK3"
    asyncio.run(test_crawler_pipeline(url_arg, level_arg))
