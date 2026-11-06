"""
tests/test_hsk_qbank_adapter.py - Integration and Verification Test Suite for Requirement R5.

Tests:
1. Schema Compatibility: Formatted question contains all required columns for pending_questions.
2. Deduplication: Cryptographic content_hash and near_duplicate_signature reject duplicates.
3. Approval Lifecycle: Staging pending question, admin approval simulation, and practice query serving.
4. Practice vs Mock Gate: Valid HSK 5 items pass both gates; incompatible items (write reorder, HSK 5 pic listening)
   pass practice gate but are rejected from mock exam gate with recorded reasons.
5. Zero Auto-Approve: Initial insertion status is strictly 'pending'.
6. Cryptographic Parity: Python hashes match TypeScript hashes byte-for-byte.
7. Option Shuffling: Answer indices are distributed (not always 0) and track correct text.
8. Batch Import Accounting: Returns accurate counts for inserted, duplicate, and error items.
9. Picture Listening Rules: Image URL required for HSK 1–3, forbidden for HSK 4–6 mock exam.
10. Database Preservation: data/hsk_exam.db SHA-256 unchanged, data/qbank/qbank.db table count preserved.
"""

import hashlib
import json
import os
import sqlite3
import tempfile
from typing import Any, Dict, List
import pytest

from hsk_qbank_adapter import (
    compute_content_hash,
    compute_near_duplicate_signature,
    ensure_pending_schema,
    format_for_qbank,
    insert_pending_question,
    batch_import_generated_questions,
)
from eligibility_gates import (
    check_practice_gate,
    check_mock_exam_gate,
    evaluate_eligibility_gates,
)


@pytest.fixture
def temp_db_path():
    """Provides a fresh temporary SQLite database for isolated test execution."""
    fd, path = tempfile.mkstemp(suffix="_test_qbank.db")
    os.close(fd)
    conn = sqlite3.connect(path)
    ensure_pending_schema(conn)
    conn.close()
    yield path
    if os.path.exists(path):
        os.remove(path)


# ============================================================================
# 1. Schema Compatibility
# ============================================================================

def test_schema_compatibility(temp_db_path):
    """
    Verifies that format_for_qbank produces all 22 required columns matching
    the production `pending_questions` schema, and that SQLite insertion succeeds.
    """
    raw_q = {
        "question": "哪怕生活遇到困难，我们也应该努力______压力。",
        "options": {
            "A": "缓解",
            "B": "减轻",
            "C": "消除",
            "D": "减少"
        },
        "answer": "A",
        "target_word": "缓解",
        "explanation_zh": "中文解析：缓解最符合搭配",
        "explanation_vi": "Giải thích chi tiết: 缓解 áp lực",
        "trap_analysis_vi": "Bẫy từ gần nghĩa",
        "topic": "职场压力调节",
    }

    formatted = format_for_qbank(
        raw_q=raw_q,
        level=5,
        skill="reading",
        part_type="read_fill_blank_4opt",
        model_name="qwen2.5:7b"
    )

    required_columns = [
        "id", "batch_id", "stem", "options", "answer_idx", "pinyin",
        "explanation_vi", "level", "skill", "part_type", "illustration_theme",
        "options_images", "topic", "status", "provider_used", "rejection_note",
        "content_hash", "near_duplicate_signature", "tested_vocab", "passage",
        "is_active"
    ]

    for col in required_columns:
        assert col in formatted, f"Missing column '{col}' in formatted question dictionary"

    assert formatted["level"] == 5
    assert formatted["skill"] == "reading"
    assert formatted["part_type"] == "read_fill_blank_4opt"
    assert formatted["status"] == "pending"
    assert formatted["is_active"] == 1
    assert "______" in formatted["stem"]
    assert formatted["pinyin"] is not None and "______" in formatted["pinyin"]

    # Verify insertion into SQLite
    ok, msg = insert_pending_question(temp_db_path, formatted)
    assert ok is True, f"Failed to insert into temp SQLite DB: {msg}"

    # Verify PRAGMA table_info match
    conn = sqlite3.connect(temp_db_path)
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(pending_questions);")
    db_cols = [row[1] for row in cur.fetchall()]
    conn.close()

    for col in required_columns:
        assert col in db_cols, f"Column '{col}' not present in pending_questions table"


# ============================================================================
# 2. Deduplication
# ============================================================================

def test_deduplication(temp_db_path):
    """
    Verifies that inserting a question with an identical content_hash or
    near_duplicate_signature is detected and rejected.
    """
    raw_q = {
        "question": "我想看______。",
        "options": ["电影", "电视", "电脑", "电话"],
        "answer": "电影",
        "explanation_vi": "Tôi muốn xem phim",
        "trap_analysis_vi": "Phân biệt các đồ dùng",
    }

    formatted_1 = format_for_qbank(
        raw_q=raw_q,
        level=1,
        skill="reading",
        part_type="read_fill_blank_4opt",
        shuffle_options=False  # Keep same options order
    )

    # First insertion must succeed
    ok1, msg1 = insert_pending_question(temp_db_path, formatted_1)
    assert ok1 is True
    assert "Inserted pending question" in msg1

    # Exact duplicate insertion must fail
    formatted_exact_dup = dict(formatted_1)
    formatted_exact_dup["id"] = "pend_different_id_123"
    ok2, msg2 = insert_pending_question(temp_db_path, formatted_exact_dup)
    assert ok2 is False
    assert "Duplicate" in msg2 or "Integrity" in msg2

    # Shuffled options near-duplicate (same stem, choices rearranged)
    formatted_shuffled_dup = format_for_qbank(
        raw_q={
            "question": "我想看______。",
            "options": ["电话", "电视", "电影", "电脑"],  # Reordered choices
            "answer": "电影",
            "explanation_vi": "Tôi muốn xem phim",
            "trap_analysis_vi": "Phân biệt các đồ dùng",
        },
        level=1,
        skill="reading",
        part_type="read_fill_blank_4opt",
        shuffle_options=False
    )
    # The near_duplicate_signature must match formatted_1
    assert formatted_shuffled_dup["near_duplicate_signature"] == formatted_1["near_duplicate_signature"]

    ok3, msg3 = insert_pending_question(temp_db_path, formatted_shuffled_dup)
    assert ok3 is False
    assert "Duplicate" in msg3


# ============================================================================
# 3. Approval Lifecycle & Serving Simulation
# ============================================================================

def test_approval_lifecycle(temp_db_path):
    """
    Simulates the full review lifecycle:
    1. Generator -> Adapter -> staged in pending_questions with status = 'pending'.
    2. Learner Practice Query initially returns 0 rows (Fail-Closed).
    3. Admin approves -> status updated to 'approved' and copied to questions.
    4. Learner Practice Query now successfully returns the approved question.
    """
    raw_q = {
        "question": "哪怕再难，我们也要坚持下去，最终______危机。",
        "options": ["化解", "解决", "处理", "应付"],
        "answer": "化解",
        "target_word": "化解",
        "explanation_vi": "化解危机 nghĩa là hóa giải khủng hoảng",
        "trap_analysis_vi": "Bẫy từ kết hợp",
    }

    formatted = format_for_qbank(
        raw_q=raw_q,
        level=5,
        skill="reading",
        part_type="read_fill_blank_4opt"
    )

    # Step 1: Insert into pending_questions
    ok, _ = insert_pending_question(temp_db_path, formatted)
    assert ok is True

    conn = sqlite3.connect(temp_db_path)
    cur = conn.cursor()

    # Step 2: Practice query should find 0 approved active questions
    cur.execute("SELECT count(*) FROM questions WHERE status = 'approved' AND is_active = 1")
    assert cur.fetchone()[0] == 0

    cur.execute("SELECT count(*) FROM pending_questions WHERE status = 'approved' AND is_active = 1")
    assert cur.fetchone()[0] == 0

    # Step 3: Admin approves the question
    cur.execute(
        "UPDATE pending_questions SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (formatted["id"],)
    )
    cur.execute("""
        INSERT INTO questions (
            id, batch_id, stem, options, answer_idx, pinyin, explanation_vi,
            level, skill, part_type, illustration_theme, options_images,
            topic, status, provider_used, rejection_note, content_hash,
            near_duplicate_signature, tested_vocab, passage, is_active
        ) SELECT
            id, batch_id, stem, options, answer_idx, pinyin, explanation_vi,
            level, skill, part_type, illustration_theme, options_images,
            topic, 'approved', provider_used, rejection_note, content_hash,
            near_duplicate_signature, tested_vocab, passage, is_active
        FROM pending_questions WHERE id = ?
    """, (formatted["id"],))
    conn.commit()

    # Step 4: Practice serving query returns the approved question
    cur.execute("""
        SELECT id, stem, level, skill, status, is_active
        FROM questions
        WHERE level = 5 AND skill = 'reading' AND status = 'approved' AND is_active = 1
    """)
    rows = cur.fetchall()
    assert len(rows) == 1
    assert rows[0][0] == formatted["id"]
    assert rows[0][4] == "approved"
    assert rows[0][5] == 1
    conn.close()

    # Step 5: Test practice gate on approved object
    approved_q = dict(formatted)
    approved_q["status"] = "approved"
    passed, reasons = check_practice_gate(approved_q, require_approved=True)
    assert passed is True
    assert len(reasons) == 0


# ============================================================================
# 4. Practice Gate vs Mock-Exam Bank Gate
# ============================================================================

def test_practice_vs_mock_gate():
    """
    Tests that:
    1. A valid HSK 5 reading question passes BOTH Practice and Mock-Exam gates.
    2. A valid HSK 5 text listening question passes BOTH gates.
    3. An incompatible item (write_sentence_reorder) passes Practice Gate
       but is blocked from Mock-Exam Gate with reason recorded.
    4. An incompatible item (picture listening at HSK 5) passes Practice Gate
       but is blocked from Mock-Exam Gate with reason recorded.
    """
    # 4.1 Valid HSK 5 Reading Question
    valid_hsk5_reading = {
        "id": "pend_5_test_reading",
        "stem": "哪怕工作再忙，我们也应该抽出时间来______压力。",
        "options": ["缓解", "减轻", "消除", "减少"],
        "answer_idx": 0,
        "explanation_vi": "缓解压力 (giảm bớt áp lực)",
        "trap_analysis_vi": "Phân tích bẫy từ gần nghĩa: 缓解 kết hợp với 压力",
        "level": 5,
        "skill": "reading",
        "part_type": "read_fill_blank_4opt",
        "tested_vocab": '["缓解"]',
        "status": "approved",
        "is_active": 1,
    }
    p_ok, p_reasons = check_practice_gate(valid_hsk5_reading, require_approved=True)
    m_ok, m_reasons = check_mock_exam_gate(valid_hsk5_reading, require_approved=True)
    assert p_ok is True, f"HSK 5 reading failed practice gate: {p_reasons}"
    assert m_ok is True, f"HSK 5 reading failed mock gate: {m_reasons}"

    # 4.2 Valid HSK 5 Text Listening Question (using official HSK 5 word '阻止')
    valid_hsk5_listening = {
        "id": "pend_5_test_listening",
        "stem": "问：女的最终决定怎么做？",
        "passage": "男：王总建议我们追加这个项目的经费。\n女：我本以为资金充裕，谁知财务审计发现多处赤字，我们非但不能注资，反而必须立即停止拨款。",
        "options": ["阻止", "赞成", "推进", "鼓励"],
        "answer_idx": 0,
        "explanation_vi": "停止拨款 tương đương với 阻止",
        "trap_analysis_vi": "Bẫy đảo ngược 本以为……谁知……",
        "level": 5,
        "skill": "listening",
        "part_type": "listen_dialogue_qa_4opt",
        "tested_vocab": '["阻止"]',
        "status": "approved",
        "is_active": 1,
    }
    p_ok_l, p_reasons_l = check_practice_gate(valid_hsk5_listening, require_approved=True)
    m_ok_l, m_reasons_l = check_mock_exam_gate(valid_hsk5_listening, require_approved=True)
    assert p_ok_l is True, f"HSK 5 listening failed practice gate: {p_reasons_l}"
    assert m_ok_l is True, f"HSK 5 listening failed mock gate: {m_reasons_l}"

    # 4.3 Incompatible Item: Writing Sentence Reorder
    # Should PASS Practice Gate (good for skill practice) but FAIL Mock-Exam Gate
    hsk5_writing_reorder = {
        "id": "pend_5_test_writing",
        "stem": "连词成句：请将下列语块排列成通顺的句子。",
        "chunks": ["哪怕面临挑战", "我们也能", "通过创新合作", "化解一切危机"],
        "full_sentence": "哪怕面临挑战，我们也能通过创新合作化解一切危机。",
        "options": [],
        "answer_idx": 0,
        "explanation_vi": "Giải thích ngữ pháp câu nhượng bộ",
        "trap_analysis_vi": "Bẫy ngữ tự sắp xếp",
        "level": 5,
        "skill": "writing",
        "part_type": "write_sentence_reorder",
        "tested_vocab": '["化解"]',
        "status": "approved",
        "is_active": 1,
    }
    p_ok_w, p_reasons_w = check_practice_gate(hsk5_writing_reorder, require_approved=True)
    m_ok_w, m_reasons_w = check_mock_exam_gate(hsk5_writing_reorder, require_approved=True)
    assert p_ok_w is True, f"Writing reorder should pass practice gate: {p_reasons_w}"
    assert m_ok_w is False, "Writing reorder must be blocked from mock exam gate"
    assert any("write_sentence_reorder" in r or "không thuộc cấu trúc đề thi chính thức" in r for r in m_reasons_w)

    # 4.4 Incompatible Item: Picture Listening at HSK 5
    # HSK 5 has no picture listening in official blueprint!
    hsk5_picture_listening = {
        "id": "pend_5_test_pic_listening",
        "stem": "问：根据对话内容，下列哪项符合事实？",
        "passage": "男：请问去地铁站怎么走？\n女：往前直走二百米就到了。",
        "options": ["地铁站", "公交站", "火车站", "机场"],
        "answer_idx": 0,
        "options_images": ["https://image.pollinations.ai/prompt/subway"],
        "explanation_vi": "Người nam hỏi đường đến ga tàu điện ngầm",
        "trap_analysis_vi": "Bẫy phương tiện",
        "level": 5,
        "skill": "listening",
        "part_type": "listen_dialogue_picture_match_split",
        "tested_vocab": '["地铁"]',
        "status": "approved",
        "is_active": 1,
    }
    p_ok_pic, p_reasons_pic = check_practice_gate(hsk5_picture_listening, require_approved=True)
    m_ok_pic, m_reasons_pic = check_mock_exam_gate(hsk5_picture_listening, require_approved=True)
    assert p_ok_pic is True, f"Picture listening should pass practice gate: {p_reasons_pic}"
    assert m_ok_pic is False, "Picture listening at HSK 5 must be blocked from mock exam gate"
    assert any("không có phần nghe nhìn tranh" in r for r in m_reasons_pic)


# ============================================================================
# 5. Zero Auto-Approve Invariant
# ============================================================================

def test_no_auto_approve(temp_db_path):
    """
    Verifies that initial question status is ALWAYS 'pending', even if
    the caller attempts to pass status='approved'.
    """
    raw_q = {
        "question": "他每天早上都去公园______。",
        "options": ["跑步", "游泳", "打球", "唱歌"],
        "answer": "跑步",
        "explanation_vi": "Chạy bộ buổi sáng",
        "trap_analysis_vi": "Phân biệt hoạt động",
        "status": "approved"  # Adversarial attempt to force approval
    }

    formatted = format_for_qbank(
        raw_q=raw_q,
        level=2,
        skill="reading",
        part_type="read_fill_blank_4opt"
    )
    assert formatted["status"] == "pending", "format_for_qbank must never auto-approve"

    # Even if modified in memory before DB insertion:
    tampered_q = dict(formatted)
    tampered_q["status"] = "approved"

    ok, _ = insert_pending_question(temp_db_path, tampered_q)
    assert ok is True

    # Check database content directly
    conn = sqlite3.connect(temp_db_path)
    cur = conn.cursor()
    cur.execute("SELECT status FROM pending_questions WHERE id = ?", (formatted["id"],))
    db_status = cur.fetchone()[0]
    conn.close()

    assert db_status == "pending", "Database insertion must enforce status='pending' (zero auto-approve)"


# ============================================================================
# 6. Cryptographic Parity Check (Python vs TypeScript)
# ============================================================================

def test_cryptographic_parity():
    """
    Verifies that Python compute_content_hash and compute_near_duplicate_signature
    produce byte-for-byte identical SHA-256 digests to the TypeScript algorithms
    on real database sample rows.
    """
    # Sample 1: From live qbank.db row 1
    stem1 = "妈妈____做的饭特别香，我们都很喜欢吃。"
    opts1 = ["亲自", "亲切", "亲人", "情感"]
    ans1 = 0

    expected_content_hash1 = "d149a535bf440051421e7adcb33becbf0d269b9098a5eec10b98a783a5c6df89"
    expected_near_dup1 = "235b1f6ff1a744a04cca62816f7085147c1f2c932751ed0e7bbadb31d2f9a48e"

    calc_content_hash1 = compute_content_hash(stem1, opts1, ans1)
    calc_near_dup1 = compute_near_duplicate_signature(stem1, opts1)

    assert calc_content_hash1 == expected_content_hash1, "content_hash parity mismatch on sample 1"
    assert calc_near_dup1 == expected_near_dup1, "near_duplicate_signature parity mismatch on sample 1"

    # Sample 2: From live qbank.db row 2
    stem2 = "我想看______。"
    opts2 = ["电影", "电视", "电脑", "电话"]
    ans2 = 0

    expected_content_hash2 = "568ae372703432895b0d3e8e8d6f3b2dcb7982a9f953f532d591f5c4aa760f83"
    expected_near_dup2 = "c357cad9714b229c59a92d36eb9d1db0f670b4e7330359ae61c06ba2c3249bcf"

    calc_content_hash2 = compute_content_hash(stem2, opts2, ans2)
    calc_near_dup2 = compute_near_duplicate_signature(stem2, opts2)

    assert calc_content_hash2 == expected_content_hash2, "content_hash parity mismatch on sample 2"
    assert calc_near_dup2 == expected_near_dup2, "near_duplicate_signature parity mismatch on sample 2"


# ============================================================================
# 7. Option Shuffling Distribution & Answer Tracking
# ============================================================================

def test_option_shuffling():
    """
    Verifies that format_for_qbank shuffles options so that the correct answer
    is not always at index 0, and that the shuffled answer_idx accurately tracks
    the correct answer text across multiple runs.
    """
    raw_q = {
        "question": "我们必须______这个难题。",
        "options": {"A": "攻克", "B": "放弃", "C": "逃避", "D": "推迟"},
        "answer": "A",
        "target_word": "攻克",
        "explanation_vi": "攻克难题 (giải quyết nan đề)",
        "trap_analysis_vi": "Phân tích từ gần nghĩa",
    }

    indices_observed = set()
    for _ in range(50):
        formatted = format_for_qbank(
            raw_q=raw_q,
            level=6,
            skill="reading",
            part_type="read_fill_blank_4opt",
            shuffle_options=True
        )
        opts = json.loads(formatted["options"])
        idx = formatted["answer_idx"]
        indices_observed.add(idx)

        # Integrity check: The element at answer_idx MUST always be the target word '攻克'
        assert opts[idx] == "攻克", f"Option shuffling corrupted answer mapping: opts={opts}, idx={idx}"

    # Over 50 random runs, more than one index position must be observed
    assert len(indices_observed) > 1, f"Options were not shuffled (observed only {indices_observed})"


# ============================================================================
# 8. Batch Import Accounting
# ============================================================================

def test_batch_import_accounting(temp_db_path):
    """
    Verifies that batch_import_generated_questions accurately accounts for
    total, inserted, duplicate, and error items.
    """
    items = [
        {
            "question": "这是我的电脑，我想买一个新______。",
            "options": ["鼠标", "键盘", "屏幕", "耳机"],
            "answer": "鼠标",
            "explanation_vi": "Giải thích mua chuột",
            "trap_analysis_vi": "Bẫy thiết bị điện tử",
        },
        {
            "question": "他每天去学校图书馆认真______。",
            "options": ["看书", "写字", "画画", "唱歌"],
            "answer": "看书",
            "explanation_vi": "Giải thích đọc sách",
            "trap_analysis_vi": "Bẫy hành động",
        },
        {
            "question": "我们一起去公园草地上快乐地______。",
            "options": ["跑步", "散步", "踢球", "聊天"],
            "answer": "跑步",
            "explanation_vi": "Giải thích chạy bộ",
            "trap_analysis_vi": "Bẫy thể thao",
        },
        {
            "question": "今天天气非常寒冷，出门要多穿______。",
            "options": ["衣服", "裤子", "鞋子", "帽子"],
            "answer": "衣服",
            "explanation_vi": "Giải thích mặc quần áo",
            "trap_analysis_vi": "Bẫy trang phục",
        },
    ]
    # Add an exact duplicate of item 0
    items.append(dict(items[0]))

    summary = batch_import_generated_questions(
        db_path=temp_db_path,
        questions=items,
        level=3,
        skill="reading"
    )

    assert summary["total"] == 5
    assert summary["inserted"] == 4
    assert summary["duplicates"] == 1
    assert len(summary["errors"]) == 0


# ============================================================================
# 9. Picture Listening Rules (HSK 1–3 Image Requirement)
# ============================================================================

def test_picture_listening_rules():
    """
    Verifies that HSK 1–3 picture listening requires image_url for mock exam,
    and passes when image_url is present.
    """
    # 9.1 HSK 2 Picture listening with image
    hsk2_pic_with_img = {
        "id": "pend_2_pic_ok",
        "stem": "问：他们打算怎么去火车站？",
        "passage": "男：外面下雨了，我们坐出租车去吧。\n女：好的，我现在就叫车。",
        "options": ["出租车", "公共汽车", "地铁", "自行车"],
        "answer_idx": 0,
        "options_images": ["https://image.pollinations.ai/prompt/taxi"],
        "explanation_vi": "Đi xe taxi",
        "trap_analysis_vi": "Bẫy thời tiết",
        "level": 2,
        "skill": "listening",
        "part_type": "listen_dialogue_picture_match_split",
        "status": "approved",
        "is_active": 1,
    }
    m_ok_with, _ = check_mock_exam_gate(hsk2_pic_with_img, require_approved=True)
    assert m_ok_with is True, "HSK 2 picture listening with image must pass mock exam gate"

    # 9.2 HSK 2 Picture listening without image
    hsk2_pic_no_img = dict(hsk2_pic_with_img)
    hsk2_pic_no_img["options_images"] = []
    m_ok_without, reasons = check_mock_exam_gate(hsk2_pic_no_img, require_approved=True)
    assert m_ok_without is False, "HSK 2 picture listening without image must fail mock exam gate"
    assert any("thiếu hình ảnh minh họa" in r for r in reasons)


# ============================================================================
# 10. Database Preservation Invariant
# ============================================================================

def test_database_preservation():
    """
    Verifies that live databases data/hsk_exam.db and data/qbank/qbank.db
    remain 100% intact and untouched.
    """
    exam_db_path = os.path.join(os.getcwd(), "data", "hsk_exam.db")
    if os.path.exists(exam_db_path):
        with open(exam_db_path, "rb") as f:
            h = hashlib.sha256(f.read()).hexdigest().upper()
        assert h == "DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1", (
            f"FATAL: data/hsk_exam.db SHA-256 altered! Expected DC299..., got {h}"
        )

    qbank_db_path = os.path.join(os.getcwd(), "data", "qbank", "qbank.db")
    if os.path.exists(qbank_db_path):
        conn = sqlite3.connect(f"file:{qbank_db_path}?mode=ro", uri=True)
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM sqlite_master WHERE type = 'table';")
        count = cur.fetchone()[0]
        conn.close()
        assert count == 12, f"data/qbank/qbank.db table count altered! Expected 12, got {count}"
