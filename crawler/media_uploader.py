import cloudinary
import cloudinary.uploader
import requests
from config.settings import settings

if settings.CLOUDINARY_CLOUD_NAME:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )

MAX_MEDIA_BYTES = 10 * 1024 * 1024  # Tối đa 10MB/file

def upload_media_to_cdn(source_media_url: str, resource_type: str = "image") -> str | None:
    """
    Tải ảnh/audio từ nguồn bên ngoài về RAM và đẩy lên Cloudinary CDN sở hữu riêng.
    Không lưu trực tiếp link nguồn để tránh lỗi chết link (hotlink-protection).
    """
    if not source_media_url or not settings.CLOUDINARY_CLOUD_NAME:
        return None
    try:
        response = requests.get(source_media_url, timeout=10, stream=True)
        if response.status_code == 200:
            content_length = int(response.headers.get('content-length', 0))
            if content_length > MAX_MEDIA_BYTES:
                return None
            upload_result = cloudinary.uploader.upload(
                response.content,
                resource_type=resource_type,
                folder="hsk_exam_media"
            )
            return upload_result.get("secure_url")
    except Exception as e:
        print(f"[Media Upload Warning] Không thể upload {source_media_url}: {e}")
        return None
    return None
