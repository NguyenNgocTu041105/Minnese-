# workers/scheduler.py
"""
CHÚ Ý QUAN TRỌNG:
File này CHỈ dùng cho môi trường Local / Development để test BlockingScheduler.
Trên môi trường Production (Railway / Render), KHÔNG dùng file này để tránh chạy container 24/7 gây tốn phí.
Thay vào đó, sử dụng cron job gọi run_ai_batch_once.py hoặc run_crawler_once.py.
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

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from workers.ai_batch_explainer import run_nightly_ai_explanation_batch

if __name__ == "__main__":
    scheduler = BlockingScheduler(timezone="Asia/Ho_Chi_Minh")
    
    # Chạy tự động vào lúc 02:30 sáng hàng ngày (Local dev only)
    scheduler.add_job(
        run_nightly_ai_explanation_batch,
        trigger=CronTrigger(hour=2, minute=30),
        id="nightly_ai_explainer",
        name="Giải thích ngữ pháp HSK Batch"
    )
    
    print("Local Scheduler đang chạy... Bấm Ctrl+C để dừng.")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        pass
