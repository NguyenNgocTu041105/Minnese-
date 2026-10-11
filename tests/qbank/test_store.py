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


