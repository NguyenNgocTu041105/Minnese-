"""
Script CLI chạy 1 tác vụ Crawl theo tham số dòng lệnh cho Cron Job.
Ví dụ:
    python workers/run_crawler_once.py --source "MockExamSite" --url "https://example.com/hsk3" --hsk-level "HSK3"
"""
import sys
import os

# Fix Windows console UTF-8 output encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import asyncio
import argparse
import logging

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from crawler.base_crawler import HSKWebCrawler

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("CronCrawler")

def parse_args():
    parser = argparse.ArgumentParser(description="Chạy Crawl câu hỏi HSK 1 lần")
    parser.add_argument("--source", type=str, required=True, help="Tên định danh nguồn (ví dụ: HSK_Standard_Site)")
    parser.add_argument("--url", type=str, required=True, help="URL mục tiêu cần cào câu hỏi")
    parser.add_argument("--hsk-level", type=str, required=True, choices=["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"], help="Cấp độ HSK")
    parser.add_argument("--ignore-robots", action="store_true", help="Bỏ qua kiểm tra robots.txt (mặc định False)")
    return parser.parse_args()

async def main():
    args = parse_args()
    logger.info(f">>> Bắt đầu Crawl: Source={args.source} | Level={args.hsk_level} | Target={args.url}")

    crawler = HSKWebCrawler(
        source_name=args.source,
        base_url=args.url,
        respect_robots_txt=not args.ignore_robots
    )

    try:
        await crawler.crawl_mock_hsk_page(target_url=args.url, hsk_level=args.hsk_level)
        logger.info(f">>> Hoàn tất tác vụ Crawl cho nguồn: {args.source}. Xem chi tiết trong bảng crawl_jobs.")
        sys.exit(0)
    except Exception as e:
        logger.critical(f">>> Crawl Job thất bại: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
