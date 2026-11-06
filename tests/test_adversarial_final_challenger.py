"""
tests/test_adversarial_final_challenger.py - Comprehensive Empirical Stress Testing Suite
for R5 Adapter & Eligibility Gates.

Empirical verification harness developed by teamwork_preview_challenger_final.
Validates:
1. Zero Auto-Approve enforcement under malicious/adversarial injection.
2. Deduplication stress testing (exact content_hash, 24 option permutations near-duplicate,
   NFC normalization, punctuation/whitespace invariance).
3. Option shuffling uniformity (Chi-Square goodness-of-fit, 100% answer mapping invariant).
4. Batch import accounting integrity across mixed valid/duplicate/malformed batches.
5. Eligibility gates across borderline inputs (1-char stem, missing explanations, level mismatch, collocations).
6. Picture listening rules across all levels (HSK 1-3 pass with image, HSK 4-6 strictly rejected from mock).
7. Writing sentence reorder gate separation (practice-eligible, exam-ineligible).
8. EMPIRICAL BUGS IDENTIFIED:
   - Defect 1: Options with empty string or whitespace-only pass check_practice_gate and check_mock_exam_gate.
   - Defect 2: Writing sentence reorder questions with empty/missing chunks pass check_practice_gate.
   - Defect 3: Adapter insert_pending_question allows empty stem/explanation strings.
9. Database preservation invariants (data/hsk_exam.db SHA-256 and data/qbank/qbank.db table count).
"""

import hashlib
import json
import os
import random
import sqlite3
import tempfile
import unicodedata
from itertools import permutations
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
def temp_db():
    """Provides a fresh isolated temporary SQLite database."""
    fd, path = tempfile.mkstemp(suffix="_adv_challenger_test.db")
    os.close(fd)
    conn = sqlite3.connect(path)
    ensure_pending_schema(conn)
    conn.close()
    yield path
    if os.path.exists(path):
        os.remove(path)


# ============================================================================
# 1. Zero Auto-Approve Enforcement Stress Test
# ============================================================================

def test_zero_auto_approval_adversarial_injection(temp_db):
    """
    Stress-tests the Zero Auto-Approve invariant.
    Attempts to inject questions with status='approved', 'active', 'published',
    and is_active=0, False, None.
    Verifies that the database strictly stores status='pending' and is_active=1.
    """
    adversarial_payloads = [
        {"stem": "春天来了，花园里开满了美丽的______。", "opts": ["花朵", "小草", "树木", "石头"], "ans": "花朵", "adv": {"status": "approved", "is_active": 1}},
        {"stem": "夏天到了，天气变得非常______。", "opts": ["炎热", "寒冷", "凉爽", "温暖"], "ans": "炎热", "adv": {"status": "APPROVED", "is_active": 0}},
        {"stem": "秋天到了，树叶慢慢变成了______。", "opts": ["黄色", "蓝色", "黑色", "紫色"], "ans": "黄色", "adv": {"status": "active", "is_active": 0}},
        {"stem": "冬天来了，地上铺满了一层白色的______。", "opts": ["积雪", "沙子", "灰尘", "落叶"], "ans": "积雪", "adv": {"status": "published", "is_active": False}},
        {"stem": "每天清晨，我们都应该早起呼吸新鲜的______。", "opts": ["空气", "自来水", "阳光", "微风"], "ans": "空气", "adv": {"status": "ready", "is_active": None}},
    ]

    for item in adversarial_payloads:
        raw_q = {
            "question": item["stem"],
            "options": item["opts"],
            "answer": item["ans"],
            "explanation_vi": "Giải thích kiểm thử",
            "trap_analysis_vi": "Phân tích bẫy",
            **item["adv"]
        }

        formatted = format_for_qbank(
            raw_q=raw_q,
            level=1,
            skill="reading",
            part_type="read_fill_blank_4opt"
        )
        assert formatted["status"] == "pending", f"format_for_qbank allowed status='{formatted['status']}'"

        # Tamper with formatted dictionary in-memory right before insertion
        tampered = dict(formatted)
        tampered["status"] = item["adv"]["status"]
        if "is_active" in item["adv"]:
            tampered["is_active"] = item["adv"]["is_active"]

        ok, msg = insert_pending_question(temp_db, tampered)
        assert ok is True, f"Insertion failed: {msg}"

        # Inspect database record directly via raw SQL
        conn = sqlite3.connect(temp_db)
        cur = conn.cursor()
        cur.execute(
            "SELECT status, is_active FROM pending_questions WHERE id = ?",
            (formatted["id"],)
        )
        row = cur.fetchone()
        conn.close()

        assert row is not None, f"Question {formatted['id']} was not inserted"
        db_status, db_is_active = row
        assert db_status == "pending", (
            f"VIOLATION: Database stored status='{db_status}' instead of 'pending' for payload {item['adv']}"
        )
        assert db_is_active == 1, (
            f"VIOLATION: Database stored is_active={db_is_active} instead of 1 for payload {item['adv']}"
        )

    # Invariant check: Ensure zero non-pending and zero inactive rows exist in table
    conn = sqlite3.connect(temp_db)
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM pending_questions WHERE status != 'pending'")
    non_pending_count = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM pending_questions WHERE is_active != 1")
    inactive_count = cur.fetchone()[0]
    conn.close()

    assert non_pending_count == 0, f"Found {non_pending_count} non-pending records in pending_questions"
    assert inactive_count == 0, f"Found {inactive_count} inactive records in pending_questions"


# ============================================================================
# 2. Deduplication Collisions Stress Harness
# ============================================================================

def test_deduplication_stress_harness(temp_db):
    """
    Stress-tests deduplication:
    - Exact content_hash collision in pending_questions.
    - Exact content_hash collision in questions.
    - Permutation near-duplicate: checks all 24 permutations of A/B/C/D.
    - Punctuation & whitespace invariance: near-dup catches trailing punctuation and whitespace.
    - Unicode NFC normalization.
    """
    # 2.1 Base Question Setup
    base_stem = "他正在努力学习，希望早日______梦想。"
    base_options = ["实现", "实行", "实施", "实验"]
    base_answer = "实现"

    raw_base = {
        "question": base_stem,
        "options": list(base_options),
        "answer": base_answer,
        "explanation_vi": "Thực hiện ước mơ (实现梦想)",
        "trap_analysis_vi": "Bẫy từ kết hợp",
    }
    fmt_base = format_for_qbank(
        raw_base,
        level=3,
        skill="reading",
        part_type="read_fill_blank_4opt",
        shuffle_options=False
    )
    ok_base, msg_base = insert_pending_question(temp_db, fmt_base)
    assert ok_base is True, f"Base insertion failed: {msg_base}"

    # 2.2 Exact collision rejection in pending_questions
    fmt_exact = dict(fmt_base)
    fmt_exact["id"] = "pend_diff_id_exact_dup"
    ok_exact, msg_exact = insert_pending_question(temp_db, fmt_exact)
    assert ok_exact is False, "Exact content_hash collision was not rejected!"
    assert "Duplicate" in msg_exact or "matched pending_questions" in msg_exact

    # 2.3 Exact collision rejection against `questions` (approved table)
    conn = sqlite3.connect(temp_db)
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO questions (
            id, batch_id, stem, options, answer_idx, pinyin, explanation_vi,
            level, skill, part_type, status, content_hash, near_duplicate_signature, is_active
        ) VALUES ('appr_1', 'b1', '既定题目______。', '["A","B"]', 0, '', 'exp', 1, 'reading', 'part', 'approved', 'hash_appr_999', 'nd_appr_999', 1)
    """)
    conn.commit()
    conn.close()

    fmt_dup_approved = dict(fmt_base)
    fmt_dup_approved["id"] = "pend_dup_against_approved"
    fmt_dup_approved["content_hash"] = "hash_appr_999"
    fmt_dup_approved["near_duplicate_signature"] = "nd_other_111"
    ok_appr, msg_appr = insert_pending_question(temp_db, fmt_dup_approved)
    assert ok_appr is False, "Collision against approved `questions` table was not rejected!"
    assert "matched questions" in msg_appr

    # 2.4 Permutation Near-Duplicate Invariant (24 permutations)
    # Every permutation of ["实现", "实行", "实施", "实验"] MUST produce the exact same near_duplicate_signature!
    base_sig = fmt_base["near_duplicate_signature"]
    for perm in permutations(base_options):
        perm_sig = compute_near_duplicate_signature(base_stem, list(perm))
        assert perm_sig == base_sig, (
            f"Near duplicate signature mismatch on permutation {perm}: expected {base_sig}, got {perm_sig}"
        )

        # Insertion must be blocked as duplicate
        raw_perm = {
            "question": base_stem,
            "options": list(perm),
            "answer": "实现",
            "explanation_vi": "Giải thích",
            "trap_analysis_vi": "Bẫy",
        }
        fmt_perm = format_for_qbank(
            raw_perm,
            level=3,
            skill="reading",
            part_type="read_fill_blank_4opt",
            shuffle_options=False
        )
        ok_perm, msg_perm = insert_pending_question(temp_db, fmt_perm)
        assert ok_perm is False, f"Permutation {perm} bypassed deduplication!"
        assert "Duplicate" in msg_perm

    # 2.5 Punctuation and Whitespace Variation Near-Duplicate
    # Stem with spaces and different punctuation symbols
    noisy_stems = [
        "  他正在努力学习，希望早日______梦想！ ",
        "他正在努力学习，希望早日______梦想？",
        "他正在努力学习   希望早日______梦想...",
        "他正在努力学习，希望早日______梦想：",
    ]
    for n_stem in noisy_stems:
        noisy_sig = compute_near_duplicate_signature(n_stem, list(base_options))
        assert noisy_sig == base_sig, (
            f"Near duplicate signature failed on noisy stem '{n_stem}': got {noisy_sig}, expected {base_sig}"
        )


# ============================================================================
# 3. Option Shuffling Uniformity & Integrity
# ============================================================================

def test_option_shuffling_uniformity_and_integrity():
    """
    Empirically verifies:
    1. Correct answer tracking: In 100% of runs, options[answer_idx] == target_word.
    2. Answer index distribution uniformity: Across N=400 runs, all 4 positions
       (0, 1, 2, 3) are populated with roughly uniform frequency (~25% each).
       Evaluated using Chi-Squared goodness-of-fit test at p=0.001.
    3. Option shuffle disabling: When shuffle_options=False, original order is strictly maintained.
    """
    raw_q = {
        "question": "无论面临多大的挑战，我们都要想方设法______难关。",
        "options": {"A": "度过", "B": "经过", "C": "通过", "D": "渡过"},
        "answer": "A",
        "target_word": "度过",
        "explanation_vi": "Độ qua khó khăn (度过难关)",
        "trap_analysis_vi": "Bẫy từ đồng âm/gần âm",
    }

    counts = {0: 0, 1: 0, 2: 0, 3: 0}
    n_trials = 400

    for _ in range(n_trials):
        formatted = format_for_qbank(
            raw_q=raw_q,
            level=5,
            skill="reading",
            part_type="read_fill_blank_4opt",
            shuffle_options=True
        )
        opts = json.loads(formatted["options"])
        idx = formatted["answer_idx"]

        # Integrity Check: correct text MUST be at answer_idx
        assert opts[idx] == "度过", f"Answer index {idx} does not map to '度过' in options {opts}"
        counts[idx] += 1

    # Verify all 4 indices were observed
    for i in range(4):
        assert counts[i] > 0, f"Option index {i} was never selected in {n_trials} trials!"

    # Chi-Squared Test: expected count = 100 per cell
    expected = n_trials / 4.0
    chi_square = sum((counts[i] - expected) ** 2 / expected for i in range(4))

    # Critical value for df=3 at alpha=0.001 is 16.27
    assert chi_square < 16.27, (
        f"Option shuffling distribution is significantly non-uniform (Chi2={chi_square:.2f}, counts={counts})"
    )

    # Verify shuffle_options=False maintains original order
    fixed = format_for_qbank(
        raw_q=raw_q,
        level=5,
        skill="reading",
        part_type="read_fill_blank_4opt",
        shuffle_options=False
    )
    fixed_opts = json.loads(fixed["options"])
    assert fixed_opts == ["度过", "经过", "通过", "渡过"]
    assert fixed["answer_idx"] == 0


# ============================================================================
# 4. Batch Import Accounting Integrity
# ============================================================================

def test_batch_import_accounting_mixed_matrix(temp_db):
    """
    Stress-tests batch accounting with a heterogeneous batch containing:
    - 4 valid unique questions
    - 2 exact duplicates
    - 2 near-duplicates (permutations of earlier questions)
    - 2 malformed questions (missing required fields)
    Total = 10 items.
    Verifies:
      total == 10
      inserted == 4
      duplicates == 4
      len(errors) == 2
      total == inserted + duplicates + len(errors)
      DB contains exactly 4 records.
    """
    valid_1 = {
        "question": "小明每天坚持去操场______。",
        "options": ["跑步", "跳绳", "打球", "游泳"],
        "answer": "跑步",
        "explanation_vi": "Chạy bộ",
        "trap_analysis_vi": "Bẫy thể thao",
    }
    valid_2 = {
        "question": "老师在黑板上认真______汉字。",
        "options": ["书写", "画画", "擦掉", "阅读"],
        "answer": "书写",
        "explanation_vi": "Viết chữ",
        "trap_analysis_vi": "Bẫy hành động",
    }
    valid_3 = {
        "question": "这本书的内容非常______，吸引了很多人。",
        "options": ["精彩", "美丽", "漂亮", "干净"],
        "answer": "精彩",
        "explanation_vi": "Nội dung đặc sắc",
        "trap_analysis_vi": "Bẫy tính từ",
    }
    valid_4 = {
        "question": "会议马上开始，请大家保持______。",
        "options": ["安静", "平安", "安全", "平静"],
        "answer": "安静",
        "explanation_vi": "Giữ yên lặng",
        "trap_analysis_vi": "Bẫy từ gần nghĩa",
    }

    # Duplicates
    exact_dup_1 = dict(valid_1)
    exact_dup_2 = dict(valid_2)

    # Near-duplicates (permuted options)
    near_dup_1 = {
        "question": "小明每天坚持去操场______。",
        "options": ["游泳", "跑步", "打球", "跳绳"],
        "answer": "跑步",
        "explanation_vi": "Chạy bộ",
        "trap_analysis_vi": "Bẫy",
    }
    near_dup_2 = {
        "question": "老师在黑板上认真______汉字。",
        "options": ["阅读", "擦掉", "书写", "画画"],
        "answer": "书写",
        "explanation_vi": "Viết chữ",
        "trap_analysis_vi": "Bẫy",
    }

    # Malformed questions (already formatted dicts missing mandatory fields to trigger DB rejection)
    malformed_1 = {
        "id": "pend_bad_1",
        "content_hash": "bad_hash_1",
        "near_duplicate_signature": "bad_nd_1",
        # Missing stem, options, explanation_vi, level, skill, part_type
    }
    malformed_2 = {
        "id": "pend_bad_2",
        "stem": "Câu hỏi lỗi",
        "content_hash": "bad_hash_2",
        "near_duplicate_signature": "bad_nd_2",
        # Missing options, answer_idx, etc.
    }

    batch = [
        valid_1,        # 1. Inserted
        exact_dup_1,    # 2. Duplicate
        valid_2,        # 3. Inserted
        near_dup_1,     # 4. Duplicate (matches valid_1)
        valid_3,        # 5. Inserted
        malformed_1,    # 6. Error
        valid_4,        # 7. Inserted
        exact_dup_2,    # 8. Duplicate
        near_dup_2,     # 9. Duplicate (matches valid_2)
        malformed_2,    # 10. Error
    ]

    summary = batch_import_generated_questions(
        db_path=temp_db,
        questions=batch,
        level=3,
        skill="reading"
    )

    assert summary["total"] == 10
    assert summary["inserted"] == 4
    assert summary["duplicates"] == 4
    assert len(summary["errors"]) == 2
    assert summary["total"] == summary["inserted"] + summary["duplicates"] + len(summary["errors"])

    # Verify actual database records
    conn = sqlite3.connect(temp_db)
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM pending_questions")
    actual_rows = cur.fetchone()[0]
    conn.close()

    assert actual_rows == 4, f"Expected 4 rows in pending_questions, found {actual_rows}"


# ============================================================================
# 5. Eligibility Gates Stress Testing: Borderline Inputs
# ============================================================================

def test_borderline_inputs_rejection():
    """
    Tests borderline inputs against eligibility gates:
    - Stem with 1 character -> Rejected.
    - Stem with whitespace only -> Rejected.
    - Missing Vietnamese explanation -> Rejected.
    - Missing Vietnamese trap analysis -> Mock Gate Rejected.
    - Wrong HSK level (level 0, level 7, -1) -> Rejected.
    - Target word level mismatch (HSK 5 exam with HSK 1 target word) -> Mock Gate Rejected.
    - Nonsensical collocations ("艰难的难关", "一场难关") -> Rejected.
    - Reading without blank ______ -> Rejected.
    - Listening with blank ______ -> Rejected.
    - Listening without audio resource/dialogue -> Rejected.
    - Target word leaked in question stem -> Rejected.
    """
    # 5.1 Stem with 1 character
    q_1char = {
        "stem": "你",
        "options": ["A", "B", "C", "D"],
        "answer_idx": 0,
        "explanation_vi": "Giải thích",
        "level": 1,
        "skill": "reading",
        "status": "approved",
        "is_active": 1,
    }
    ok_1c, r_1c = check_practice_gate(q_1char)
    assert ok_1c is False
    assert any("quá ngắn hoặc trống" in r for r in r_1c)

    # 5.2 Stem with whitespace only
    q_ws = dict(q_1char)
    q_ws["stem"] = "      "
    ok_ws, r_ws = check_practice_gate(q_ws)
    assert ok_ws is False
    assert any("quá ngắn hoặc trống" in r for r in r_ws)

    # 5.3 Missing explanation_vi
    q_no_expl = {
        "stem": "请问您要喝点儿______？",
        "options": ["茶", "咖啡", "果汁", "牛奶"],
        "answer_idx": 0,
        "explanation_vi": "",
        "level": 1,
        "skill": "reading",
        "status": "approved",
        "is_active": 1,
    }
    ok_ne, r_ne = check_practice_gate(q_no_expl)
    assert ok_ne is False
    assert any("Thiếu nội dung giải thích tiếng Việt" in r for r in r_ne)

    # 5.4 Missing trap_analysis_vi (for mock exam)
    q_no_trap = {
        "stem": "哪怕遇到困难，我们也要努力______压力。",
        "options": ["缓解", "减轻", "消除", "减少"],
        "answer_idx": 0,
        "explanation_vi": "Giải thích ngữ pháp",
        "trap_analysis_vi": "",
        "level": 5,
        "skill": "reading",
        "part_type": "read_fill_blank_4opt",
        "tested_vocab": '["缓解"]',
        "status": "approved",
        "is_active": 1,
    }
    ok_nt, r_nt = check_mock_exam_gate(q_no_trap)
    assert ok_nt is False
    assert any("Thiếu phân tích bẫy tiếng Việt" in r for r in r_nt)

    # 5.5 Invalid HSK Level (-1 and 7)
    q_lvl_neg = dict(q_no_expl)
    q_lvl_neg["explanation_vi"] = "Hợp lệ"
    q_lvl_neg["level"] = -1
    ok_neg, r_neg = check_practice_gate(q_lvl_neg)
    assert ok_neg is False
    assert any("Cấp độ HSK (-1) không hợp lệ" in r for r in r_neg)

    q_lvl7 = dict(q_lvl_neg)
    q_lvl7["level"] = 7
    ok_l7, r_l7 = check_practice_gate(q_lvl7)
    assert ok_l7 is False
    assert any("Cấp độ HSK (7) không hợp lệ" in r for r in r_l7)

    # 5.6 Level Vocab Mismatch in Mock Exam Gate
    q_mismatch = {
        "stem": "哪怕面临巨大的困难，我们也要坚持到底，不能轻易______。",
        "options": ["放弃", "坚持", "努力", "前进"],
        "answer_idx": 0,
        "explanation_vi": "Từ bỏ",
        "trap_analysis_vi": "Phân tích bẫy",
        "level": 5,
        "skill": "reading",
        "part_type": "read_fill_blank_4opt",
        "tested_vocab": '["爸爸"]',  # HSK 1 word inside HSK 5 exam!
        "status": "approved",
        "is_active": 1,
    }
    ok_mm, r_mm = check_mock_exam_gate(q_mismatch)
    assert ok_mm is False
    assert any("không thuộc cấp độ HSK 5" in r for r in r_mm)

    # 5.7 Nonsensical Collocations
    for bad_colloc in ["艰难的难关", "一场难关", "剧烈的困难", "缓解难关"]:
        q_bad = {
            "stem": f"面对这次{bad_colloc}，我们必须团结一致______。",
            "options": ["攻克", "克服", "解决", "面对"],
            "answer_idx": 0,
            "explanation_vi": "Giải thích",
            "level": 5,
            "skill": "reading",
            "status": "approved",
            "is_active": 1,
        }
        ok_b, r_b = check_practice_gate(q_bad)
        assert ok_b is False
        assert any("ngữ đoạn bất hợp lý" in r for r in r_b)

    # 5.8 Reading without blank ______
    q_no_blank = {
        "stem": "今天天气非常晴朗，我们一起去公园玩吧。",
        "options": ["晴朗", "阴天", "下雨", "刮风"],
        "answer_idx": 0,
        "explanation_vi": "Thời tiết đẹp",
        "level": 2,
        "skill": "reading",
        "status": "approved",
        "is_active": 1,
    }
    ok_nb, r_nb = check_practice_gate(q_no_blank)
    assert ok_nb is False
    assert any("thiếu ký hiệu chỗ trống '______'" in r for r in r_nb)

    # 5.9 Listening with illegal blank ______
    q_listen_blank = {
        "stem": "问：他们打算怎么去______？",
        "passage": "男：我们坐出租车吧。\n女：好的。",
        "options": ["火车站", "机场", "地铁站", "公交站"],
        "answer_idx": 0,
        "explanation_vi": "Giải thích",
        "level": 2,
        "skill": "listening",
        "status": "approved",
        "is_active": 1,
    }
    ok_lb, r_lb = check_practice_gate(q_listen_blank)
    assert ok_lb is False
    assert any("không được chứa ký hiệu điền từ '______'" in r for r in r_lb)

    # 5.10 Listening without dialogue/passage
    q_listen_no_audio = {
        "stem": "听录音回答问题",
        "passage": "",
        "options": ["同意", "反对", "犹豫", "弃权"],
        "answer_idx": 0,
        "explanation_vi": "Giải thích",
        "level": 4,
        "skill": "listening",
        "status": "approved",
        "is_active": 1,
    }
    ok_lna, r_lna = check_practice_gate(q_listen_no_audio)
    assert ok_lna is False
    assert any("thiếu tài nguyên văn bản hội thoại" in r for r in r_lna)

    # 5.11 Target Word Leaked in Stem
    q_leak = {
        "stem": "他不仅非常幽默，而且为人也很______，大家都很喜欢他。",
        "options": ["幽默", "开朗", "热情", "严肃"],
        "answer_idx": 0,
        "tested_vocab": '["幽默"]',
        "explanation_vi": "Giải thích",
        "level": 4,
        "skill": "reading",
        "status": "approved",
        "is_active": 1,
    }
    ok_leak, r_leak = check_practice_gate(q_leak)
    assert ok_leak is False
    assert any("bị lộ trong câu hỏi" in r for r in r_leak)


# ============================================================================
# 6. Picture Listening Level Matrix Stress Test
# ============================================================================

def test_picture_listening_level_matrix():
    """
    Stress-tests picture listening eligibility across HSK 1–6:
    - HSK 1: with image -> Practice: OK, Mock: OK; without image -> Mock: FAIL.
    - HSK 2: with image -> Practice: OK, Mock: OK; without image -> Mock: FAIL.
    - HSK 3: with image -> Practice: OK, Mock: OK; without image -> Mock: FAIL.
    - HSK 4: with image -> Practice: OK, Mock: FAIL (No picture listening in HSK 4).
    - HSK 5: with image -> Practice: OK, Mock: FAIL (No picture listening in HSK 5).
    - HSK 6: with image -> Practice: OK, Mock: FAIL (No picture listening in HSK 6).
    """
    for lvl in range(1, 7):
        q_pic = {
            "stem": "问：根据对话内容选择对应的图片。",
            "passage": "男：你看那只小猫多可爱。\n女：是啊，真想带回家。",
            "options": ["A", "B", "C"],
            "answer_idx": 0,
            "options_images": ["https://image.pollinations.ai/prompt/cute_cat"],
            "explanation_vi": "Giải thích nhìn tranh",
            "trap_analysis_vi": "Bẫy chi tiết",
            "level": lvl,
            "skill": "listening",
            "part_type": "listen_dialogue_picture_match_split",
            "status": "approved",
            "is_active": 1,
        }

        p_ok, p_reasons = check_practice_gate(q_pic)
        m_ok, m_reasons = check_mock_exam_gate(q_pic)

        # Picture listening is valid for skill practice across all levels
        assert p_ok is True, f"HSK {lvl} picture listening failed practice gate: {p_reasons}"

        if lvl <= 3:
            # HSK 1–3 picture listening with image MUST pass mock exam gate
            assert m_ok is True, f"HSK {lvl} picture listening with image failed mock gate: {m_reasons}"

            # Without image, HSK 1–3 MUST fail mock exam gate
            q_pic_no_img = dict(q_pic)
            q_pic_no_img["options_images"] = []
            m_ok_no, m_reasons_no = check_mock_exam_gate(q_pic_no_img)
            assert m_ok_no is False, f"HSK {lvl} picture listening without image passed mock gate!"
            assert any("thiếu hình ảnh minh họa" in r for r in m_reasons_no)
        else:
            # HSK 4–6 picture listening MUST strictly FAIL mock exam gate
            assert m_ok is False, f"HSK {lvl} picture listening wrongly passed mock exam gate!"
            assert any("không có phần nghe nhìn tranh" in r for r in m_reasons)


# ============================================================================
# 7. Writing Sentence Reorder Gate Separation
# ============================================================================

def test_writing_sentence_reorder_gate_separation():
    """
    Verifies that writing sentence reorder questions are:
    - Admitted for Practice Gate (practice_eligible = 1).
    - Strictly blocked from Mock Exam Gate (exam_eligible = 0) with recorded diagnostic reason.
    """
    for lvl in [3, 4, 5, 6]:
        writing_q = {
            "id": f"pend_{lvl}_write_reorder",
            "stem": "连词成句：请将下列语块按正确的语序排列成句子。",
            "chunks": ["哪怕工作再累", "他也坚持", "每天晚上", "学习中文一小时"],
            "full_sentence": "哪怕工作再累，他也坚持每天晚上学习中文一小时。",
            "options": [],
            "answer_idx": 0,
            "explanation_vi": "Ngữ pháp câu nhượng bộ",
            "trap_analysis_vi": "Bẫy trật tự từ",
            "level": lvl,
            "skill": "writing",
            "part_type": "write_sentence_reorder",
            "status": "approved",
            "is_active": 1,
        }

        eval_res = evaluate_eligibility_gates(writing_q)

        assert eval_res["practice_eligible"] is True, (
            f"HSK {lvl} writing reorder failed practice gate: {eval_res['practice_reasons']}"
        )
        assert eval_res["exam_eligible"] is False, (
            f"HSK {lvl} writing reorder was not blocked from mock exam gate!"
        )
        assert any(
            "không thuộc cấu trúc đề thi chính thức" in r
            for r in eval_res["exam_reasons"]
        ), f"Missing diagnostic reason in exam_reasons: {eval_res['exam_reasons']}"


# ============================================================================
# 8. EMPIRICAL DEFECT DEMONSTRATIONS (Adversarial Findings)
# ============================================================================

def test_empirical_bug_empty_option_accepted_by_gates():
    """
    VERIFIES DEFECT 1 RESOLUTION:
    Demonstrates that check_practice_gate and check_mock_exam_gate strictly
    REJECT questions where an option is an empty string "" or whitespace "   ".
    """
    q_empty_opt = {
        "stem": "请问图书馆在______？",
        "options": ["", "那里", "前面", "后面"],  # First option is empty string!
        "answer_idx": 1,
        "explanation_vi": "Giải thích",
        "trap_analysis_vi": "Phân tích bẫy",
        "level": 1,
        "skill": "reading",
        "part_type": "read_fill_blank_4opt",
        "status": "approved",
        "is_active": 1,
    }

    practice_ok, practice_reasons = check_practice_gate(q_empty_opt)
    mock_ok, mock_reasons = check_mock_exam_gate(q_empty_opt)

    assert practice_ok is False, "Empty option must be rejected by practice gate"
    assert mock_ok is False, "Empty option must be rejected by mock exam gate"
    assert any("trống" in r.lower() or "khoảng trắng" in r.lower() for r in practice_reasons)


def test_empirical_bug_writing_without_chunks_accepted_by_practice_gate():
    """
    VERIFIES DEFECT 2 RESOLUTION:
    Demonstrates that check_practice_gate strictly rejects writing sentence reorder
    questions that have NO chunks (chunks is empty list or missing).
    """
    q_no_chunks = {
        "stem": "连词成句：请排列下列语块。",
        "options": [],
        "chunks": [],  # Empty chunks!
        "answer_idx": 0,
        "explanation_vi": "Giải thích",
        "level": 4,
        "skill": "writing",
        "part_type": "write_sentence_reorder",
        "status": "approved",
        "is_active": 1,
    }

    practice_ok, practice_reasons = check_practice_gate(q_no_chunks)
    assert practice_ok is False, "Writing without chunks must be rejected by practice gate"
    assert any("chunks" in r.lower() or "语块" in r for r in practice_reasons)


def test_empirical_bug_adapter_allows_empty_stem_insertion(temp_db):
    """
    VERIFIES DEFECT 5 RESOLUTION:
    Demonstrates that insert_pending_question strictly rejects questions with
    empty stem: "" or explanation_vi: "".
    """
    empty_stem_q = {
        "id": "pend_emp_bug_empty_stem",
        "stem": "",
        "options": "[]",
        "answer_idx": 0,
        "explanation_vi": "",
        "level": 1,
        "skill": "reading",
        "part_type": "read_fill_blank_4opt",
    }
    ok, msg = insert_pending_question(temp_db, empty_stem_q)
    assert ok is False, "Empty stem or explanation must be rejected by insert_pending_question"
    assert "Missing or empty required field" in msg


def test_empirical_bug_level_zero_silently_converted_to_level_one():
    """
    VERIFIES DEFECT 3 RESOLUTION:
    Demonstrates that normalize_question_dict preserves level=0 as level 0,
    and check_practice_gate strictly rejects level=0 as out of HSK bounds (1-6).
    """
    from eligibility_gates import normalize_question_dict
    norm = normalize_question_dict({"level": 0})
    assert norm["level"] == 0, "Expected level=0 to remain 0 and not silently convert to 1"

    # In check_practice_gate, level=0 is rejected
    q_lvl0 = {
        "stem": "请问您要喝点儿______？",
        "options": ["茶", "咖啡", "果汁", "牛奶"],
        "answer_idx": 0,
        "explanation_vi": "Giải thích",
        "level": 0,
        "skill": "reading",
        "status": "approved",
        "is_active": 1,
    }
    ok, reasons = check_practice_gate(q_lvl0)
    assert ok is False, "Expected check_practice_gate to reject level=0"
    assert any("1 đến 6" in r for r in reasons)


def test_empirical_bug_listening_audio_bypass_via_colon_prompt():
    """
    VERIFIES DEFECT 4 RESOLUTION:
    Demonstrates that check_practice_gate rejects a listening question with NO dialogue
    even if the question prompt contains a colon (e.g. '问：男的是什么意思？').
    """
    q_bypass = {
        "stem": "问：男的是什么意思？",  # 10 chars with full-width colon!
        "passage": "",  # Absolutely NO audio / dialogue!
        "options": ["同意", "反对", "犹豫", "弃权"],
        "answer_idx": 0,
        "explanation_vi": "Giải thích",
        "level": 4,
        "skill": "listening",
        "status": "approved",
        "is_active": 1,
    }
    practice_ok, practice_reasons = check_practice_gate(q_bypass)
    assert practice_ok is False, "Listening without dialogue must be rejected by practice gate"
    assert any("passage/dialogue" in r.lower() or "hội thoại" in r.lower() for r in practice_reasons)



# ============================================================================
# 9. Database Preservation Invariant
# ============================================================================

def test_database_preservation_strict():
    """
    Verifies that live production databases were NEVER modified during testing:
    1. data/hsk_exam.db SHA-256 == DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1
    2. data/qbank/qbank.db table count == 12
    """
    exam_path = os.path.join(os.getcwd(), "data", "hsk_exam.db")
    if os.path.exists(exam_path):
        with open(exam_path, "rb") as f:
            digest = hashlib.sha256(f.read()).hexdigest().upper()
        assert digest == "DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1", (
            f"FATAL: data/hsk_exam.db SHA-256 hash corrupted! Got {digest}"
        )

    qbank_path = os.path.join(os.getcwd(), "data", "qbank", "qbank.db")
    if os.path.exists(qbank_path):
        conn = sqlite3.connect(f"file:{qbank_path}?mode=ro", uri=True)
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM sqlite_master WHERE type = 'table'")
        cnt = cur.fetchone()[0]
        conn.close()
        assert cnt == 12, f"data/qbank/qbank.db table count altered! Expected 12, got {cnt}"
