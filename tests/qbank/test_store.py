def test_store_save_and_get(test_store, sample_question):
    assert test_store.save_question(sample_question) is True
    fetched = test_store.get_question(sample_question.question_id)
    assert fetched is not None
    assert fetched.question_id == sample_question.question_id
    assert fetched.stem == sample_question.stem
    assert fetched.options == sample_question.options
    assert fetched.content_hash == sample_question.content_hash


def test_store_get_by_hash(test_store, sample_question):
    test_store.save_question(sample_question)
    fetched = test_store.get_question_by_hash(sample_question.content_hash)
    assert fetched is not None
    assert fetched.question_id == sample_question.question_id


def test_store_update_status(test_store, sample_question):
    test_store.save_question(sample_question)
    assert test_store.update_status(sample_question.question_id, "approved") is True
    updated = test_store.get_question(sample_question.question_id)
    assert updated.status == "approved"


def test_store_report_question_threshold(test_store, sample_question):
    # Approve first
    sample_question.status = "approved"
    test_store.save_question(sample_question)

    # 1st report
    cnt = test_store.record_report(sample_question.question_id, "Sai đáp án")
    assert cnt == 1
    assert test_store.get_question(sample_question.question_id).status == "approved"

    # 2nd report
    cnt = test_store.record_report(sample_question.question_id, "Chữ Hán sai nét")
    assert cnt == 2
    assert test_store.get_question(sample_question.question_id).status == "approved"

    # 3rd report -> reaches default threshold 3, automatically switches to needs_review
    cnt = test_store.record_report(sample_question.question_id, "Đáp án B mới đúng")
    assert cnt == 3
    q_after = test_store.get_question(sample_question.question_id)
    assert q_after.status == "needs_review"
    assert q_after.report_count == 3


def test_store_sync_log(test_store, sample_question):
    test_store.save_question(sample_question)
    sync_id = test_store.record_sync(
        batch_id="batch-001",
        question_id=sample_question.question_id,
        legacy_source_url="qbank_original:batch-001",
        legacy_id="leg-uuid-001"
    )
    assert sync_id is not None
    records = test_store.get_sync_records_by_batch("batch-001")
    assert len(records) == 1
    assert records[0].status == "active"
    assert records[0].legacy_id == "leg-uuid-001"

    # Retire sync
    test_store.mark_sync_retired("batch-001")
    records_retired = test_store.get_sync_records_by_batch("batch-001")
    assert records_retired[0].status == "retired"


def test_store_stats(test_store, sample_question):
    test_store.save_question(sample_question)
    stats = test_store.get_stats()
    assert stats["total_questions"] == 1
    assert stats["by_level"].get(1) == 1


def test_store_duplicate_content_hash_returns_false(test_store, sample_question):
    # First save succeeds
    assert test_store.save_question(sample_question) is True

    # Second question has different ID but exact same content and answer -> same content_hash
    dup_q = sample_question.model_copy(update={"question_id": "qb_different_id_same_content"})
    # Saving duplicate content_hash returns False and does NOT raise IntegrityError
    assert test_store.save_question(dup_q) is False


def test_get_store_lazy(tmp_path):
    from qbank.store import get_store
    db_file = str(tmp_path / "lazy_qbank.db")
    store = get_store(db_path=db_file)
    assert store.db_path == db_file
    stats = store.get_stats()
    assert stats["total_questions"] == 0


def test_store_sync_log_unique_constraint(test_store, sample_question):
    import sqlite3
    import pytest

    test_store.save_question(sample_question)
    # First sync succeeds
    sync1 = test_store.record_sync(
        batch_id="batch-dup-check",
        question_id=sample_question.question_id,
        legacy_source_url="qbank_original:batch-dup-check",
        legacy_id="leg-uuid-dup1"
    )
    assert sync1 is not None

    # Second sync with identical (question_id, batch_id) violates UNIQUE(question_id, batch_id)
    with pytest.raises(sqlite3.IntegrityError):
        test_store.record_sync(
            batch_id="batch-dup-check",
            question_id=sample_question.question_id,
            legacy_source_url="qbank_original:batch-dup-check",
            legacy_id="leg-uuid-dup2"
        )


def test_store_save_and_get_grouped_question(test_store, sample_question):
    # Create question with grouped fields
    data = sample_question.model_dump()
    data["question_id"] = "qb_grouped_001"
    data["group_id"] = "grp_reading_hsk1"
    data["group_passage"] = "大卫在学校学习汉语。他很喜欢中国文化。"
    data["group_options"] = ["学校", "医院", "商店", "机场", "车站"]
    data["content_hash"] = sample_question.compute_hash(data["stem"], data["options"], data["answer_index"])

    grouped_q = sample_question.__class__.model_validate(data)
    assert test_store.save_question(grouped_q) is True

    fetched = test_store.get_question("qb_grouped_001")
    assert fetched is not None
    assert fetched.group_id == "grp_reading_hsk1"
    assert fetched.group_passage == "大卫在学校学习汉语。他很喜欢中国文化。"
    assert fetched.group_options == ["学校", "医院", "商店", "机场", "车站"]


def test_store_idempotent_schema_migration(tmp_path):
    import sqlite3
    import json
    from qbank.models import QbQuestion
    from qbank.store import QbStore

    db_file = str(tmp_path / "legacy_migration_test.db")

    # 1. Create legacy schema table missing group_id, group_passage, group_options
    conn = sqlite3.connect(db_file)
    conn.execute("""
        CREATE TABLE qb_questions (
            question_id TEXT PRIMARY KEY,
            level INTEGER NOT NULL,
            skill TEXT NOT NULL,
            part_type TEXT NOT NULL,
            stem TEXT NOT NULL,
            passage TEXT,
            options TEXT NOT NULL,
            answer_index INTEGER NOT NULL,
            explanation_vi TEXT NOT NULL,
            pinyin_stem TEXT,
            vocab_tags TEXT,
            topic TEXT,
            difficulty TEXT,
            display_label TEXT,
            provenance TEXT NOT NULL,
            qa TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'needs_review',
            report_count INTEGER DEFAULT 0,
            times_answered INTEGER DEFAULT 0,
            times_wrong INTEGER DEFAULT 0,
            content_hash TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    # Insert a legacy row
    computed_hash = QbQuestion.compute_hash("测试题目", ["A", "B", "C", "D"], 0)
    conn.execute("""
        INSERT INTO qb_questions (
            question_id, level, skill, part_type, stem, options, answer_index,
            explanation_vi, provenance, qa, content_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        "leg_001", 1, "reading", "reading_fill_blank", "测试题目",
        json.dumps(["A", "B", "C", "D"]), 0, "Giải thích bài học",
        json.dumps({
            "origin": "original_generated",
            "batch_id": "b-leg",
            "prompt_version": "v1",
            "llm_model": "mock",
            "created_at": "2026-10-17"
        }),
        json.dumps({"structure_ok": True, "level_ok": True, "out_of_level_words": [], "notes": []}),
        computed_hash
    ))
    conn.commit()
    conn.close()

    # 2. Instantiate QbStore and run init_schema()
    store = QbStore(db_path=db_file)
    store.init_schema()

    # Check columns after migration
    with store.session() as c:
        cur = c.cursor()
        cur.execute("PRAGMA table_info(qb_questions);")
        cols = {row[1] for row in cur.fetchall()}
        assert "group_id" in cols
        assert "group_passage" in cols
        assert "group_options" in cols

    # 3. Verify idempotency: calling init_schema again should not error
    store.init_schema()

    # 4. Verify existing row can be loaded cleanly with None grouped fields
    loaded = store.get_question("leg_001")
    assert loaded is not None
    assert loaded.group_id is None
    assert loaded.group_passage is None
    assert loaded.group_options is None


