"""
Tự động Dump toàn bộ Database PostgreSQL, nén gzip và upload lên Cloudinary Raw Storage.
Thích hợp chạy định kỳ mỗi tuần 1 lần bằng Cron Job:
    0 21 * * 0  (Chạy 04:00 AM sáng Chủ Nhật hàng tuần theo giờ VN)
"""
import os
import sys
import gzip
import subprocess
from datetime import datetime
import cloudinary
import cloudinary.uploader
from config.settings import settings

if settings.CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )

def backup_database():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"hsk_backup_{timestamp}.sql.gz"

    print(f"[{datetime.now()}] Bắt đầu sao lưu database...")

    # 1. Chạy pg_dump và nén trực tiếp vào file .gz
    try:
        dump_process = subprocess.Popen(
            ["pg_dump", settings.DATABASE_URL],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = dump_process.communicate()

        if dump_process.returncode != 0:
            raise RuntimeError(f"pg_dump thất bại: {stderr.decode('utf-8')}")

        with gzip.open(backup_filename, "wb") as f_out:
            f_out.write(stdout)

        file_size_kb = os.path.getsize(backup_filename) / 1024
        print(f"Đã tạo file dump nén: {backup_filename} ({file_size_kb:.2f} KB)")

        # 2. Upload file backup lên Cloudinary dưới dạng Raw file nếu cấu hình Cloudinary
        if settings.CLOUDINARY_CLOUD_NAME:
            upload_result = cloudinary.uploader.upload(
                backup_filename,
                resource_type="raw",
                folder="db_backups",
                public_id=f"backup_{timestamp}"
            )
            secure_url = upload_result.get("secure_url")
            print(f"🎉 Backup hoàn tất! File đã được lưu an toàn tại Cloudinary CDN:\n{secure_url}")
        else:
            print("Đã tạo backup file thành công tại thư mục hiện tại.")

    except Exception as e:
        print(f"❌ Lỗi sao lưu database: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        # Dọn dẹp file tạm cục bộ
        if settings.CLOUDINARY_CLOUD_NAME and os.path.exists(backup_filename):
            os.remove(backup_filename)

if __name__ == "__main__":
    backup_database()
