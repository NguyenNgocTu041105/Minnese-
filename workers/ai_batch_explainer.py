import json
import logging
from google import genai
from google.genai import types
from config.settings import settings
from db.connection import get_db_cursor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AIBatchExplainer")

def get_genai_client():
    return genai.Client(apiKey=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = """Bạn là một Giảng viên Sư phạm Tiếng Trung & Chuyên gia Khảo thí HSK cao cấp.
Nhiệm vụ: Giải thích chi tiết, ngắn gọn đáp án đúng và phân tích ngữ pháp/từ vựng trọng tâm.

QUY TẮC BẮT BUỘC:
1. Trả về DUY NHẤT một JSON Array thuần túy, KHÔNG bọc mã markdown, KHÔNG kèm lời dẫn.
2. Lời giải bằng Tiếng Việt, súc tích dưới 100 từ/câu.
3. Giữ nguyên 'question_id' của từng câu hỏi.

SCHEMA:
[
  {"question_id": "uuid-string", "explanation": "Dịch: ... Phân tích ngữ pháp: ..."}
]
"""

def process_single_batch(batch_questions: list[dict], is_retry: bool = False) -> int:
    """Gửi 1 batch (20 câu) lên Gemini API và cập nhật DB."""
    if not batch_questions:
        return 0

    ai_client = get_genai_client()

    input_payload = [
        {
            "question_id": str(q["id"]),
            "hanzi": q["hanzi_content"],
            "options": q["options"],
            "correct_answer": q["correct_answer"],
            "hsk_level": q["hsk_level"]
        }
        for q in batch_questions
    ]

    prompt_content = f"Hãy tạo lời giải thích cho các câu hỏi HSK sau:\n{json.dumps(input_payload, ensure_ascii=False)}"

    try:
        response = ai_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt_content,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.2,
                response_mime_type="application/json"
            )
        )

        raw_text = response.text.strip()
        parsed_results = json.loads(raw_text)

        if not isinstance(parsed_results, list) or len(parsed_results) == 0:
            raise ValueError("Output không phải là mảng JSON hợp lệ")

        # Validate từng phần tử
        valid_updates = []
        for item in parsed_results:
            q_id = item.get("question_id")
            explanation = item.get("explanation")
            if q_id and explanation:
                valid_updates.append((explanation.strip(), q_id))

        # Cập nhật DB hàng loạt
        if valid_updates:
            with get_db_cursor(commit=True) as cur:
                cur.executemany("""
                    UPDATE questions
                    SET ai_explanation = %s
                    WHERE id = %s;
                """, valid_updates)
            return len(valid_updates)

    except Exception as e:
        logger.error(f"[AI Batch Error] Thất bại lần 1: {e}")
        if not is_retry:
            logger.info("Đang Retry lại batch với prompt cảnh báo...")
            return process_single_batch(batch_questions, is_retry=True)
        else:
            logger.error(f"[AI Batch Dropped] Bỏ qua batch {len(batch_questions)} câu do lỗi.")
            return 0
    return 0

def run_nightly_ai_explanation_batch():
    """Hàm chính chạy ngầm vào 02:00 - 04:00 sáng."""
    logger.info("=== BẮT ĐẦU BATCH AI GIẢI THÍCH BAN ĐÊM ===")
    BATCH_SIZE = 20

    with get_db_cursor() as cur:
        cur.execute("""
            SELECT id, hanzi_content, options, correct_answer, hsk_level
            FROM questions
            WHERE status = 'approved' AND ai_explanation IS NULL
            LIMIT 500;
        """)
        pending_questions = cur.fetchall()

    if not pending_questions:
        logger.info("Không có câu hỏi nào cần tạo lời giải thích.")
        return

    total_updated = 0
    for i in range(0, len(pending_questions), BATCH_SIZE):
        chunk = pending_questions[i:i + BATCH_SIZE]
        logger.info(f"Đang xử lý batch {i//BATCH_SIZE + 1} ({len(chunk)} câu)...")
        updated_count = process_single_batch(chunk)
        total_updated += updated_count

    logger.info(f"=== HOÀN TẤT BATCH: Đã cập nhật thành công {total_updated} câu hỏi ===")
