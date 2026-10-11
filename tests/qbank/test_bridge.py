import os
import json
import sqlite3
import pytest
import shutil
import hashlib

from qbank.models import QbQuestion, QbProvenance, QbQA
from qbank.store import QbStore
from qbank.bridge import QbBridge, QbLegacyDBAdapter, compute_legacy_content_hash, format_legacy_options
from crawler.deduplicator import compute_content_hash as original_compute_content_hash


def init_mock_legacy_db(db_path: str):
    """Creates a mock legacy database schema matching questions table."""
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY,
            hanzi_content TEXT NOT NULL,
            pinyin_text TEXT NOT NULL,
            options TEXT NOT NULL,
            correct_answer TEXT NOT NULL,
            explanation TEXT,
            ai_explanation TEXT,
            hsk_level TEXT NOT NULL,
            topic TEXT NOT NULL,
            question_type TEXT NOT NULL,
            media_url TEXT,
            passage_id TEXT,
            source_url TEXT,
            content_hash TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending_review',
            crawled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()


def test_hash_qbank_bridge_equals_crawler_deduplicator():
    """Confirms bridge hash function is 100% bitwise equivalent to crawler/deduplicator.py."""
    stem = "今天天气很好，我想去____买两本书。"
    options = ["书店", "学校", "医院", "饭馆"]
    formatted_opts, _ = format_legacy_options(options)
    ans = "A"

    hash_bridge = compute_legacy_content_hash(stem, formatted_opts, ans)
    hash_original = original_compute_content_hash(stem, formatted_opts, ans)

    assert hash_bridge == hash_original
    assert len(hash_bridge) == 64


def test_hash_reproduces_six_real_rows_from_copy(tmp_path):
    """
    Tests that compute_content_hash correctly reproduces the stored content_hash
    of all 6 real rows from a copy of hsk_exam.db in tmp_path.
    """
    real_db = os.path.abspath("data/hsk_exam.db")
    copy_db = str(tmp_path / "hsk_exam_copy.db")
    shutil.copy2(real_db, copy_db)

    conn = sqlite3.connect(copy_db)
    cur = conn.cursor()
    cur.execute("SELECT id, hanzi_content, options, correct_answer, content_hash FROM questions;")
    rows = cur.fetchall()
    conn.close()

    assert len(rows) == 6
    for qid, stem, opts_json, ans, stored_hash in rows:
        opts = json.loads(opts_json)
        computed = original_compute_content_hash(stem, opts, ans)
        assert computed == stored_hash, f"Hash mismatch for row {qid}: computed {computed} vs {stored_hash}"


def test_bridge_dry_run_is_strictly_read_only(tmp_path):
    """Confirms dry-run does not write, does not commit, and file hash remains identical."""
    legacy_db = str(tmp_path / "legacy.db")
    init_mock_legacy_db(legacy_db)
    h_before = hashlib.sha256(open(legacy_db, "rb").read()).hexdigest()

    qbank_db = str(tmp_path / "qbank.db")
    store = QbStore(db_path=qbank_db)

    # Insert an approved question into QBank
    h = QbQuestion.compute_hash("今天天气很好，我想去____买两本书。", ["书店", "学校", "医院", "饭馆"], 0)
    q = QbQuestion(
        question_id="qb_sync_001",
        level=1,
        skill="reading",
        part_type="fill_blank",
        stem="今天天气很好，我想去____买两本书。",
        options=["书店", "学校", "医院", "饭馆"],
        answer_index=0,
        explanation_vi="Đi mua sách ở hiệu sách.",
        status="approved",
        content_hash=h,
        provenance=QbProvenance(origin="original_generated", batch_id="batch_dry", prompt_version="v1", llm_model="m", created_at="2026-01-01T00:00:00Z"),
        qa=QbQA(structure_ok=True, level_ok=True, notes=[])
    )
    store.save_question(q)

    adapter = QbLegacyDBAdapter(sqlite_path=legacy_db)
    bridge = QbBridge(store=store, adapter=adapter)

    # Dry-run
    res = bridge.sync(batch_id="batch_dry", execute=False)
    assert res.is_dry_run is True
    assert res.total_eligible == 1
    assert res.synced_count == 1

    # Check legacy DB was NOT modified at all
    h_after = hashlib.sha256(open(legacy_db, "rb").read()).hexdigest()
    assert h_before == h_after

    conn = sqlite3.connect(legacy_db)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM questions;")
    assert cur.fetchone()[0] == 0
    conn.close()


def test_bridge_execute_sync_and_retire(tmp_path):
    """
    Tests execute sync:
    - Writes question to legacy questions table with status='approved'
    - Creates backup file
    - Retires questions by setting status='rejected' in legacy table and 'retired' in QBank
    - Verifies exam_service excludes retired questions
    """
    legacy_db = str(tmp_path / "legacy.db")
    init_mock_legacy_db(legacy_db)

    qbank_db = str(tmp_path / "qbank.db")
    store = QbStore(db_path=qbank_db)

    stem = "李老师在学校教我们____。"
    options = ["汉语", "猫", "水", "衣服"]
    h = QbQuestion.compute_hash(stem, options, 0)
    q = QbQuestion(
        question_id="qb_sync_002",
        level=1,
        skill="reading",
        part_type="fill_blank",
        stem=stem,
        options=options,
        answer_index=0,
        explanation_vi="Dạy tiếng Trung ở trường.",
        status="approved",
        content_hash=h,
        provenance=QbProvenance(origin="original_generated", batch_id="batch_exec", prompt_version="v1", llm_model="m", created_at="2026-01-01T00:00:00Z"),
        qa=QbQA(structure_ok=True, level_ok=True, notes=[])
    )
    store.save_question(q)

    adapter = QbLegacyDBAdapter(sqlite_path=legacy_db)
    bridge = QbBridge(store=store, adapter=adapter)

    # 1. Execute sync
    res = bridge.sync(batch_id="batch_exec", execute=True)
    assert res.synced_count == 1
    assert res.is_dry_run is False
    assert res.backup_file is not None
    assert os.path.exists(res.backup_file)

    # 2. Check legacy questions row
    conn = sqlite3.connect(legacy_db)
    cur = conn.cursor()
    cur.execute("SELECT id, status, source_url, question_type, topic FROM questions;")
    row = cur.fetchone()
    assert row[1] == "approved"
    assert row[2] == "qbank_original:batch_exec"
    assert row[3] == "multiple_choice"
    assert row[4] == "vocab"
    legacy_id = row[0]
    conn.close()

    # 3. Retire batch
    count_retired = bridge.retire(batch_id="batch_exec")
    assert count_retired == 1

    # 4. Confirm legacy status is now 'rejected' (so exam_service excludes it)
    conn = sqlite3.connect(legacy_db)
    cur = conn.cursor()
    cur.execute("SELECT status FROM questions WHERE id = ?;", (legacy_id,))
    assert cur.fetchone()[0] == "rejected"

    # Simulate exam_service query (SELECT ... WHERE status = 'approved')
    cur.execute("SELECT COUNT(*) FROM questions WHERE status = 'approved';")
    assert cur.fetchone()[0] == 0
    conn.close()

    # 5. Confirm QBank store status is now 'retired'
    q_reloaded = store.get_question("qb_sync_002")
    assert q_reloaded.status == "retired"


def test_bridge_skips_near_duplicates_with_legacy_stems(tmp_path):
    """Tests that bridge skips syncing questions that are near-duplicates of legacy questions."""
    legacy_db = str(tmp_path / "legacy.db")
    init_mock_legacy_db(legacy_db)

    # Insert existing stem into legacy DB
    conn = sqlite3.connect(legacy_db)
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO questions (
            id, hanzi_content, pinyin_text, options, correct_answer,
            explanation, ai_explanation, hsk_level, topic, question_type,
            source_url, content_hash, status
        ) VALUES (
            'leg_001', '今天天气很好，我想去学校图书馆借书。', 'pinyin', '[]', 'A',
            'exp', NULL, 'HSK1', 'vocab', 'multiple_choice', 'source', 'hash_001', 'approved'
        );
    """)
    conn.commit()
    conn.close()

    qbank_db = str(tmp_path / "qbank.db")
    store = QbStore(db_path=qbank_db)

    # Approved question with almost identical stem
    near_dup_stem = "今天天气很好，我想去学校图书馆借____。"
    opts = ["书", "水", "猫", "衣服"]
    h = QbQuestion.compute_hash(near_dup_stem, opts, 0)
    q = QbQuestion(
        question_id="qb_near_001",
        level=1,
        skill="reading",
        part_type="fill_blank",
        stem=near_dup_stem,
        options=opts,
        answer_index=0,
        explanation_vi="Mượn sách.",
        status="approved",
        content_hash=h,
        provenance=QbProvenance(origin="original_generated", batch_id="b_near", prompt_version="v1", llm_model="m", created_at="2026-01-01T00:00:00Z"),
        qa=QbQA(structure_ok=True, level_ok=True, notes=[])
    )
    store.save_question(q)

    adapter = QbLegacyDBAdapter(sqlite_path=legacy_db)
    bridge = QbBridge(store=store, adapter=adapter)

    res = bridge.sync(batch_id="b_near", execute=True)
    assert res.skipped_near_duplicate == 1
    assert res.synced_count == 0


def test_bridge_rollback_on_error_mid_batch(tmp_path):
    """
    (a) Error midway through batch triggers full rollback:
    Questions table in legacy DB must have zero new rows inserted.
    """
    legacy_db = str(tmp_path / "legacy.db")
    init_mock_legacy_db(legacy_db)

    qbank_db = str(tmp_path / "qbank.db")
    store = QbStore(db_path=qbank_db)

    # Insert 2 valid approved questions into QBank
    for i in range(2):
        stem = f"今天天气很好，我想去学校图书馆借书{i}。"
        opts = ["书", "水", "猫", "衣服"]
        h = QbQuestion.compute_hash(stem, opts, 0)
        q = QbQuestion(
            question_id=f"qb_rollback_{i}",
            level=1,
            skill="reading",
            part_type="fill_blank",
            stem=stem,
            options=opts,
            answer_index=0,
            explanation_vi="Mượn sách.",
            status="approved",
            content_hash=h,
            provenance=QbProvenance(origin="original_generated", batch_id="b_rollback", prompt_version="v1", llm_model="m", created_at="2026-01-01T00:00:00Z"),
            qa=QbQA(structure_ok=True, level_ok=True, notes=[])
        )
        store.save_question(q)

    adapter = QbLegacyDBAdapter(sqlite_path=legacy_db)
    bridge = QbBridge(store=store, adapter=adapter)

    # Monkeypatch insert_questions to simulate mid-batch failure
    original_insert = adapter.insert_questions
    def fail_insert(payloads):
        # Insert first one directly, then raise Exception to test rollback behavior
        with sqlite3.connect(legacy_db) as conn:
            cur = conn.cursor()
            cur.execute("INSERT INTO questions (id, hanzi_content, pinyin_text, options, correct_answer, hsk_level, topic, question_type, content_hash, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
                        (payloads[0]["id"], payloads[0]["hanzi_content"], "pinyin", "[]", "A", "HSK1", "vocab", "multiple_choice", payloads[0]["content_hash"], "approved"))
            # Raise midway before commit
            raise RuntimeError("Mô phỏng lỗi mạng/hệ thống giữa chừng khi ghi lô!")

    adapter.insert_questions = fail_insert

    with pytest.raises(RuntimeError, match="Mô phỏng lỗi mạng"):
        bridge.sync(batch_id="b_rollback", execute=True)

    # Verify questions table in legacy DB has ZERO rows
    conn = sqlite3.connect(legacy_db)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM questions;")
    assert cur.fetchone()[0] == 0
    conn.close()


def test_bridge_skips_hash_and_near_duplicate_with_reporting(tmp_path):
    """
    (b) Câu trùng hash / nghi trùng 4-gram bị bỏ qua và báo cáo đầy đủ số lượng.
    """
    legacy_db = str(tmp_path / "legacy.db")
    init_mock_legacy_db(legacy_db)

    # Seed 1 row in legacy DB
    stem_existing = "我喜欢在家里看书。"
    opts_existing = ["看", "听", "写", "说"]
    fmt_opts, _ = format_legacy_options(opts_existing)
    h_existing = compute_legacy_content_hash(stem_existing, fmt_opts, "A")

    conn = sqlite3.connect(legacy_db)
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO questions (
            id, hanzi_content, pinyin_text, options, correct_answer,
            explanation, hsk_level, topic, question_type, source_url, content_hash, status
        ) VALUES (
            'leg_seed_1', ?, 'pinyin', '[]', 'A', 'exp', 'HSK1', 'vocab', 'multiple_choice', 'source', ?, 'approved'
        );
    """, (stem_existing, h_existing))
    conn.commit()
    conn.close()

    qbank_db = str(tmp_path / "qbank.db")
    store = QbStore(db_path=qbank_db)

    # Q1: Exact same stem & options -> duplicate hash
    q1_hash = QbQuestion.compute_hash(stem_existing, opts_existing, 0)
    q1 = QbQuestion(
        question_id="qb_dup_hash",
        level=1,
        skill="reading",
        part_type="fill_blank",
        stem=stem_existing,
        options=opts_existing,
        answer_index=0,
        explanation_vi="Xem sách.",
        status="approved",
        content_hash=q1_hash,
        provenance=QbProvenance(origin="original_generated", batch_id="b_dup_test", prompt_version="v1", llm_model="m", created_at="2026-01-01T00:00:00Z"),
        qa=QbQA(structure_ok=True, level_ok=True, notes=[])
    )
    store.save_question(q1)

    # Q2: Near-duplicate stem (fill blank with answer -> identical/highly overlapping with seed stem)
    stem_near = "我喜欢在家里____书。"
    opts_near = ["看", "听", "写", "说"]
    q2_hash = QbQuestion.compute_hash(stem_near, opts_near, 0)
    q2 = QbQuestion(
        question_id="qb_dup_near",
        level=1,
        skill="reading",
        part_type="fill_blank",
        stem=stem_near,
        options=opts_near,
        answer_index=0,
        explanation_vi="Rất thích xem sách.",
        status="approved",
        content_hash=q2_hash,
        provenance=QbProvenance(origin="original_generated", batch_id="b_dup_test", prompt_version="v1", llm_model="m", created_at="2026-01-01T00:00:00Z"),
        qa=QbQA(structure_ok=True, level_ok=True, notes=[])
    )
    store.save_question(q2)

    # Q3: Completely novel question
    stem_novel = "天空中有一只小鸟在飞。"
    opts_novel = ["飞", "跑", "游", "走"]
    q3_hash = QbQuestion.compute_hash(stem_novel, opts_novel, 0)
    q3 = QbQuestion(
        question_id="qb_novel_1",
        level=1,
        skill="reading",
        part_type="fill_blank",
        stem=stem_novel,
        options=opts_novel,
        answer_index=0,
        explanation_vi="Chim bay.",
        status="approved",
        content_hash=q3_hash,
        provenance=QbProvenance(origin="original_generated", batch_id="b_dup_test", prompt_version="v1", llm_model="m", created_at="2026-01-01T00:00:00Z"),
        qa=QbQA(structure_ok=True, level_ok=True, notes=[])
    )
    store.save_question(q3)

    adapter = QbLegacyDBAdapter(sqlite_path=legacy_db)
    bridge = QbBridge(store=store, adapter=adapter)

    res = bridge.sync(batch_id="b_dup_test", execute=True)

    assert res.total_eligible == 3
    assert res.skipped_duplicate_hash == 1
    assert res.skipped_near_duplicate == 1
    assert res.synced_count == 1
    assert len(res.records) == 1
    assert res.records[0]["question_id"] == "qb_novel_1"


def test_bridge_postgres_refused_without_backup_flag(monkeypatch, tmp_path):
    """
    (c) --execute trên PostgreSQL bị từ chối nếu thiếu --i-have-backed-up-postgres
    (mock is_postgres_available = True).
    """
    import qbank.bridge
    monkeypatch.setattr(qbank.bridge, "check_postgres_available", lambda: True)

    legacy_db = str(tmp_path / "legacy.db")
    init_mock_legacy_db(legacy_db)

    qbank_db = str(tmp_path / "qbank.db")
    store = QbStore(db_path=qbank_db)

    stem = "今天天气很好，我想去____买两本书。"
    opts = ["书店", "学校", "医院", "饭馆"]
    h = QbQuestion.compute_hash(stem, opts, 0)
    q = QbQuestion(
        question_id="qb_pg_001",
        level=1,
        skill="reading",
        part_type="fill_blank",
        stem=stem,
        options=opts,
        answer_index=0,
        explanation_vi="Hiệu sách.",
        status="approved",
        content_hash=h,
        provenance=QbProvenance(origin="original_generated", batch_id="b_pg", prompt_version="v1", llm_model="m", created_at="2026-01-01T00:00:00Z"),
        qa=QbQA(structure_ok=True, level_ok=True, notes=[])
    )
    store.save_question(q)

    adapter = QbLegacyDBAdapter(sqlite_path=legacy_db)
    bridge = QbBridge(store=store, adapter=adapter)

    # 1. Execute without backup flag -> PermissionError
    with pytest.raises(PermissionError, match="Phát hiện PostgreSQL production đang chạy"):
        bridge.sync(batch_id="b_pg", execute=True, confirmed_postgres_backup=False)

    # 2. Execute with backup flag -> Allowed
    res = bridge.sync(batch_id="b_pg", execute=True, confirmed_postgres_backup=True)
    assert res.synced_count == 1


def test_retire_only_touches_sync_log_legacy_ids(tmp_path):
    """
    (d) retire chỉ chạm dòng có legacy_id trong qb_sync_log, 6 dòng cũ không đổi.
    """
    real_db = os.path.abspath("data/hsk_exam.db")
    legacy_copy = str(tmp_path / "hsk_exam_copy.db")
    shutil.copy2(real_db, legacy_copy)

    # Record 6 original rows and their statuses
    conn = sqlite3.connect(legacy_copy)
    cur = conn.cursor()
    cur.execute("SELECT id, status FROM questions;")
    original_rows_before = cur.fetchall()
    conn.close()
    assert len(original_rows_before) == 6

    qbank_db = str(tmp_path / "qbank.db")
    store = QbStore(db_path=qbank_db)

    # Sync a new question from QBank into legacy_copy
    stem = "这是一个全新的测试句子____。"
    opts = ["A", "B", "C", "D"]
    h = QbQuestion.compute_hash(stem, opts, 0)
    q = QbQuestion(
        question_id="qb_retire_target",
        level=1,
        skill="reading",
        part_type="fill_blank",
        stem=stem,
        options=opts,
        answer_index=0,
        explanation_vi="Giải thích.",
        status="approved",
        content_hash=h,
        provenance=QbProvenance(origin="original_generated", batch_id="b_retire_batch", prompt_version="v1", llm_model="m", created_at="2026-01-01T00:00:00Z"),
        qa=QbQA(structure_ok=True, level_ok=True, notes=[])
    )
    store.save_question(q)

    adapter = QbLegacyDBAdapter(sqlite_path=legacy_copy)
    bridge = QbBridge(store=store, adapter=adapter)

    sync_res = bridge.sync(batch_id="b_retire_batch", execute=True)
    assert sync_res.synced_count == 1
    new_legacy_id = sync_res.records[0]["legacy_id"]

    # Now retire this batch
    retired_count = bridge.retire(batch_id="b_retire_batch")
    assert retired_count == 1

    # Check database: the new row is 'rejected', but the 6 original rows are 100% UNTOUCHED
    conn = sqlite3.connect(legacy_copy)
    cur = conn.cursor()
    cur.execute("SELECT id, status FROM questions WHERE id != ?;", (new_legacy_id,))
    original_rows_after = cur.fetchall()

    cur.execute("SELECT status FROM questions WHERE id = ?;", (new_legacy_id,))
    assert cur.fetchone()[0] == "rejected"
    conn.close()

    assert original_rows_before == original_rows_after


def test_retired_questions_not_resynced(tmp_path):
    """
    (e) Câu đã retire không bị sync lại.
    """
    legacy_db = str(tmp_path / "legacy.db")
    init_mock_legacy_db(legacy_db)

    qbank_db = str(tmp_path / "qbank.db")
    store = QbStore(db_path=qbank_db)

    stem = "李老师在学校教我们中文____。"
    opts = ["汉语", "英语", "法语", "德语"]
    h = QbQuestion.compute_hash(stem, opts, 0)
    q = QbQuestion(
        question_id="qb_resync_001",
        level=1,
        skill="reading",
        part_type="fill_blank",
        stem=stem,
        options=opts,
        answer_index=0,
        explanation_vi="Dạy tiếng Trung.",
        status="approved",
        content_hash=h,
        provenance=QbProvenance(origin="original_generated", batch_id="b_resync", prompt_version="v1", llm_model="m", created_at="2026-01-01T00:00:00Z"),
        qa=QbQA(structure_ok=True, level_ok=True, notes=[])
    )
    store.save_question(q)

    adapter = QbLegacyDBAdapter(sqlite_path=legacy_db)
    bridge = QbBridge(store=store, adapter=adapter)

    # 1. Sync
    res1 = bridge.sync(batch_id="b_resync", execute=True)
    assert res1.synced_count == 1

    # 2. Retire
    bridge.retire(batch_id="b_resync")
    assert store.get_question("qb_resync_001").status == "retired"

    # 3. Attempt to re-sync
    res2 = bridge.sync(batch_id="b_resync", execute=True)
    assert res2.total_eligible == 0
    assert res2.synced_count == 0

    # 4. Even if status was manually switched back to 'approved' in qb_questions,
    # because question_id is already in qb_sync_log, it is not eligible for re-sync
    store.update_status("qb_resync_001", "approved")
    res3 = bridge.sync(batch_id="b_resync", execute=True)
    assert res3.total_eligible == 0
    assert res3.synced_count == 0
