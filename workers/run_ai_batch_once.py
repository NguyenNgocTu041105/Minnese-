"""
Script chạy 1 lần cho Cron Job trên PaaS (Railway Cron / Render Cron Job).
Nhiệm vụ: Chạy tác vụ AI giải thích ngữ pháp theo batch ban đêm rồi thoát.
Exit code: 0 = Thành công, 1 = Thất bại (để cron runner ghi nhận trạng thái).
"""
import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import logging
from workers.ai_batch_explainer import run_nightly_ai_explanation_batch

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("CronAIBatch")

def main():
    logger.info(">>> Khởi động AI Batch Explanation Job (Run Once)...")
    try:
        run_nightly_ai_explanation_batch()
        logger.info(">>> AI Batch Job hoàn tất thành công.")
        sys.exit(0)
    except Exception as e:
        logger.critical(f">>> AI Batch Job gặp lỗi nghiêm trọng: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
