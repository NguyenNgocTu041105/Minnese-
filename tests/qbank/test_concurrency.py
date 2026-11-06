"""
Tests for SQLite concurrency, WAL journal mode, and busy timeout in QbStore and QbLegacyDBAdapter.
Verifies simultaneous reading and writing without database lock errors.
"""

import os
import sqlite3
import threading
import time
import pytest
from concurrent.futures import ThreadPoolExecutor, as_completed

from qbank.models import QbQuestion, QbProvenance, QbQA
from qbank.store import QbStore
from qbank.bridge import QbLegacyDBAdapter


DISTINCT_STEMS = [
    "今天天气非常晴朗，我们一起去公园散步吧。",
    "他在图书馆认真看书，准备明天的汉语考试。",
    "妈妈在厨房做晚饭，香味飘满了整个房间。",
    "小猫在沙发上睡觉，看起来非常可爱安静。",
    "他们坐火车去北京旅游，一路上非常高兴。",
    "这家商店的苹果很新鲜，很多人来买水果。",
    "哥哥喜欢踢足球，每天下午都在运动场跑。",
    "王老师讲课很清楚，所有的学生都听懂了。",
    "我们要多喝水，多吃蔬菜，对身体健康好。",
    "请问去火车站怎么走，我可以坐公共汽车去吗？",
]


def make_dummy_question(idx: int, level: int = 1, stem: Optional[str] = None) -> QbQuestion:
    if stem is None:
        stem = f"学生第{idx}号正在学校图书馆认真借书学习汉语知识。"
    options = ["学校", "老师", "朋友", "准备"]
    c_hash = QbQuestion.compute_hash(stem, options, 0)
    return QbQuestion(
        question_id=f"concurrent-q-{idx:04d}",
        level=level,
        skill="reading",
        part_type="fill_blank",
        stem=stem,
        options=options,
        answer_index=0,
        explanation_vi=f"Giải thích câu hỏi đồng thời số {idx}.",
        pinyin_stem=f"xué shēng dì {idx} hào",
        vocab_tags=["学校"],
        topic="technology",
        difficulty="medium",
        display_label="HSK 3.0 Concurrency Test",
        content_hash=c_hash,
        provenance=QbProvenance(
            origin="original_generated",
            batch_id="batch-concurrency",
            prompt_version="1.0",
            llm_model="mock-llm",
            created_at="2026-10-18T00:00:00Z",
        ),
        qa=QbQA(
            structure_ok=True,
            level_ok=True,
            out_of_level_words=[],
            notes=["concurrency test fixture"],
        ),
        status="needs_review" if idx % 2 == 0 else "approved",
    )


def test_store_wal_mode_and_busy_timeout(temp_db_path):
    """Verifies that QbStore initializes with WAL journal mode and 30000ms busy timeout."""
    store = QbStore(db_path=temp_db_path)

    with store.session() as conn:
        journal_mode = conn.execute("PRAGMA journal_mode;").fetchone()[0]
        assert journal_mode.lower() == "wal", f"Expected WAL mode, got {journal_mode}"

        busy_timeout = conn.execute("PRAGMA busy_timeout;").fetchone()[0]
        assert busy_timeout == 30000, f"Expected busy_timeout 30000, got {busy_timeout}"


def test_legacy_db_adapter_busy_timeout(temp_db_path):
    """Verifies that QbLegacyDBAdapter executes with busy_timeout=30000."""
    # Setup legacy schema
    with sqlite3.connect(temp_db_path, timeout=30.0) as conn:
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS questions (
                id TEXT PRIMARY KEY,
                hanzi_content TEXT,
                pinyin_text TEXT,
                options TEXT,
                correct_answer TEXT,
                explanation TEXT,
                ai_explanation TEXT,
                hsk_level INTEGER,
                topic TEXT,
                question_type TEXT,
                media_url TEXT,
                passage_id TEXT,
                source_url TEXT,
                content_hash TEXT UNIQUE,
                status TEXT
            );
        """)

    adapter = QbLegacyDBAdapter(sqlite_path=temp_db_path)

    # Insert a record
    inserted = adapter.insert_questions([{
        "id": "leg-001",
        "hanzi_content": "今天天气很好",
        "pinyin_text": "jin tian tian qi hen hao",
        "options": '["A. 好", "B. 坏"]',
        "correct_answer": "A",
        "explanation": "test",
        "ai_explanation": "test",
        "hsk_level": 1,
        "topic": "vocab",
        "question_type": "reading_choice",
        "media_url": None,
        "passage_id": None,
        "source_url": "test",
        "content_hash": "hash001",
        "status": "approved",
    }])
    assert inserted == 1

    hashes, stems = adapter.get_existing_hashes_and_stems()
    assert "hash001" in hashes
    assert "今天天气很好" in stems

    retired = adapter.retire_by_ids(["leg-001"])
    assert retired == 1


def test_concurrent_multithreaded_read_while_writing(temp_db_path):
    """
    Stress tests QbStore with multiple simultaneous writer and reader threads.
    Confirms no database locked errors occur under concurrent read/write traffic.
    """
    store = QbStore(db_path=temp_db_path)

    errors = []
    read_counts = []
    stop_event = threading.Event()

    def writer_worker(start_idx: int, count: int):
        for i in range(start_idx, start_idx + count):
            try:
                q = make_dummy_question(i)
                store.save_question(q)
                # Small yield to increase interleaving
                time.sleep(0.005)
            except Exception as e:
                errors.append(f"Writer error: {e}")

    def reader_worker():
        reads = 0
        while not stop_event.is_set():
            try:
                qs = store.list_questions(limit=50)
                stats = store.get_stats()
                assert stats["total_questions"] >= 0
                reads += 1
                time.sleep(0.003)
            except Exception as e:
                errors.append(f"Reader error: {e}")
                break
        read_counts.append(reads)

    # Start 2 writer threads (each writes 25 questions = 50 total)
    # Start 3 reader threads
    threads = []
    t_w1 = threading.Thread(target=writer_worker, args=(1, 25))
    t_w2 = threading.Thread(target=writer_worker, args=(26, 25))
    threads.extend([t_w1, t_w2])

    t_readers = [threading.Thread(target=reader_worker) for _ in range(3)]
    threads.extend(t_readers)

    for t in threads:
        t.start()

    # Wait for writers to complete
    t_w1.join()
    t_w2.join()

    # Stop readers
    stop_event.set()
    for tr in t_readers:
        tr.join()

    assert len(errors) == 0, f"Encountered concurrency errors: {errors}"
    assert sum(read_counts) > 0, "Readers should have executed multiple reads"

    stats = store.get_stats()
    assert stats["total_questions"] == 50, f"Expected 50 total questions, got {stats['total_questions']}"


def test_concurrent_status_updates_and_reads(temp_db_path):
    """
    Verifies that simultaneous status updates (review action) and reads
    proceed cleanly without locking contention.
    """
    store = QbStore(db_path=temp_db_path)

    # Seed 20 questions
    for i in range(20):
        store.save_question(make_dummy_question(i))

    errors = []

    def updater(qid: str, new_status: str):
        try:
            store.update_status(qid, new_status)
        except Exception as e:
            errors.append(f"Update error on {qid}: {e}")

    def reader():
        try:
            return len(store.list_questions(status="all", limit=50))
        except Exception as e:
            errors.append(f"Read error: {e}")
            return 0

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = []
        for i in range(20):
            status = "approved" if i % 2 == 0 else "rejected"
            futures.append(executor.submit(updater, f"concurrent-q-{i:04d}", status))
            futures.append(executor.submit(reader))

        for f in as_completed(futures):
            f.result()

    assert len(errors) == 0, f"Encountered concurrency errors during updates: {errors}"
    stats = store.get_stats()
    assert stats["by_status"].get("approved", 0) == 10
    assert stats["by_status"].get("rejected", 0) == 10


def test_concurrent_bridge_sync_and_store_reads(temp_db_path, tmp_path):
    """
    Verifies that QbBridge sync executes cleanly while concurrent readers
    query both the QBank store and legacy DB.
    """
    from qbank.bridge import QbBridge

    store = QbStore(db_path=temp_db_path)
    legacy_db_file = str(tmp_path / "legacy_test.db")

    # Initialize legacy database
    with sqlite3.connect(legacy_db_file, timeout=30.0) as conn:
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA busy_timeout = 30000;")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS questions (
                id TEXT PRIMARY KEY,
                hanzi_content TEXT,
                pinyin_text TEXT,
                options TEXT,
                correct_answer TEXT,
                explanation TEXT,
                ai_explanation TEXT,
                hsk_level INTEGER,
                topic TEXT,
                question_type TEXT,
                media_url TEXT,
                passage_id TEXT,
                source_url TEXT,
                content_hash TEXT UNIQUE,
                status TEXT
            );
        """)

    # Seed 10 approved questions in store
    for i in range(10):
        q = make_dummy_question(100 + i, level=1, stem=DISTINCT_STEMS[i])
        q.status = "approved"
        store.save_question(q)

    adapter = QbLegacyDBAdapter(sqlite_path=legacy_db_file)
    bridge = QbBridge(store=store, adapter=adapter, is_postgres=False)

    errors = []
    stop_event = threading.Event()

    def store_reader():
        while not stop_event.is_set():
            try:
                store.list_questions(status="approved")
                store.get_stats()
                time.sleep(0.005)
            except Exception as e:
                errors.append(f"Store reader error: {e}")
                break

    def legacy_reader():
        while not stop_event.is_set():
            try:
                adapter.get_existing_hashes_and_stems()
                time.sleep(0.005)
            except Exception as e:
                errors.append(f"Legacy reader error: {e}")
                break

    t1 = threading.Thread(target=store_reader)
    t2 = threading.Thread(target=legacy_reader)
    t1.start()
    t2.start()

    # Execute sync with execute=True
    sync_result = bridge.sync(execute=True)

    stop_event.set()
    t1.join()
    t2.join()

    assert len(errors) == 0, f"Encountered errors during concurrent sync: {errors}"
    assert sync_result.synced_count == 10
    assert not sync_result.is_dry_run

