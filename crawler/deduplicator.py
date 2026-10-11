import hashlib
import re

def compute_content_hash(hanzi_content: str, options: list[dict], correct_answer: str) -> str:
    """
    Tạo mã SHA-256 fingerprint duy nhất từ nội dung câu hỏi đã chuẩn hóa.
    Loại bỏ mọi khoảng trắng và ký tự đặc biệt để chống trùng lặp tuyệt đối.
    """
    clean_content = re.sub(r'[\s\W_]+', '', hanzi_content)
    sorted_options = sorted([re.sub(r'[\s\W_]+', '', opt.get("text", "")) for opt in options])
    normalized_str = f"{clean_content}|{'|'.join(sorted_options)}|{correct_answer.strip().upper()}"
    return hashlib.sha256(normalized_str.encode('utf-8')).hexdigest()
