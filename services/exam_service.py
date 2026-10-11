"""
Sinh đề Real-time: Hoàn toàn dùng PostgreSQL + Redis. 0% AI Token.
Dùng kỹ thuật Index-sampling ngẫu nhiên, loại trừ câu hỏi user đã gặp gần đây.
"""
import random
import json
import redis
from config.settings import settings
from db.connection import get_db_cursor

try:
    redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception:
    redis_client = None

def generate_exam_for_user(user_id: str, hsk_level: str, limit: int = 40) -> dict:
    # 1. Lấy danh sách câu hỏi đã gặp trong 30 ngày gần nhất của User để loại trừ
    with get_db_cursor() as cur:
        cur.execute("""
            SELECT question_id FROM user_seen_questions
            WHERE user_id = %s AND seen_at >= CURRENT_TIMESTAMP - INTERVAL '30 days';
        """, (user_id,))
        seen_ids = [str(r["question_id"]) for r in cur.fetchall()]

    # 2. Query ngẫu nhiên từ ngân hàng câu hỏi (CHỈ LẤY status = 'approved')
    with get_db_cursor(commit=True) as cur:
        if seen_ids:
            cur.execute("""
                SELECT id, hanzi_content, pinyin_text, options, correct_answer, 
                       explanation, ai_explanation, topic, question_type, media_url
                FROM questions
                WHERE hsk_level = %s 
                  AND status = 'approved'
                  AND id != ALL(%s::uuid[])
                ORDER BY RANDOM()
                LIMIT %s;
            """, (hsk_level, seen_ids, limit))
        else:
            cur.execute("""
                SELECT id, hanzi_content, pinyin_text, options, correct_answer, 
                       explanation, ai_explanation, topic, question_type, media_url
                FROM questions
                WHERE hsk_level = %s 
                  AND status = 'approved'
                ORDER BY RANDOM()
                LIMIT %s;
            """, (hsk_level, limit))
        
        selected_questions = cur.fetchall()

        # Nếu ngân hàng chưa đủ câu mới, fallback lấy thêm câu bất kỳ (chấp nhận lặp)
        if len(selected_questions) < limit:
            cur.execute("""
                SELECT id, hanzi_content, pinyin_text, options, correct_answer, 
                       explanation, ai_explanation, topic, question_type, media_url
                FROM questions
                WHERE hsk_level = %s AND status = 'approved'
                ORDER BY RANDOM()
                LIMIT %s;
            """, (hsk_level, limit))
            selected_questions = cur.fetchall()

        # 3. Ghi nhận các câu đã xem vào user_seen_questions
        if selected_questions:
            seen_records = [(user_id, q["id"]) for q in selected_questions]
            cur.executemany("""
                INSERT INTO user_seen_questions (user_id, question_id, seen_at)
                VALUES (%s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id, question_id) 
                DO UPDATE SET seen_at = CURRENT_TIMESTAMP;
            """, seen_records)

    # 4. Trộn ngẫu nhiên đáp án A/B/C/D để chống gian lận
    formatted_questions = []
    for q in selected_questions:
        raw_options = q["options"]
        if isinstance(raw_options, str):
            raw_options = json.loads(raw_options)
        
        # Clone và shuffle
        shuffled_opts = list(raw_options)
        random.shuffle(shuffled_opts)
        
        formatted_questions.append({
            "id": str(q["id"]),
            "hanzi_content": q["hanzi_content"],
            "pinyin_text": q["pinyin_text"],
            "options": shuffled_opts,
            "topic": q["topic"],
            "question_type": q["question_type"],
            "media_url": q["media_url"]
        })

    return {
        "hsk_level": hsk_level,
        "total_questions": len(formatted_questions),
        "questions": formatted_questions
    }
