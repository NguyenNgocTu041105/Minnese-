import os
import argparse
import pytest
from unittest.mock import patch

from qbank.models import QbQuestion, QbProvenance, QbQA
from qbank.store import QbStore
from qbank.cli import handle_set_status, handle_recheck
from qbank.bridge import QbBridge, QbLegacyDBAdapter
import sqlite3


def make_test_question(qid: str, level: int = 1, status: str = "approved", stem: str = "今天天气很好，我想去____借书。", options: list = None, notes: list = None):
    if options is None:
        options = ["学校", "医院", "银行", "机场"]
    if notes is None:
        notes = []
    return QbQuestion(
        question_id=qid,
        level=level,
        skill="reading",
        part_type="fill_blank",
        stem=stem,
        options=options,
        answer_index=0,
        explanation_vi="Giải thích mẫu.",
        status=status,
        content_hash=QbQuestion.compute_hash(stem, options, 0),
        provenance=QbProvenance(origin="original_generated", batch_id="b_test", prompt_version="v1", llm_model="gemini-3.5-flash", created_at="2026-10-16T10:00:00Z"),
        qa=QbQA(structure_ok=True, level_ok=True, notes=notes)
    )


def test_cli_set_status(tmp_path):
    """set-status command updates question status and appends reason."""
    db_file = str(tmp_path / "test_qbank.db")
    store = QbStore(db_path=db_file)
    q = make_test_question("q_status", status="needs_review")
    store.save_question(q)

    args = argparse.Namespace(question_id="q_status", status="approved", reason="Kiểm tra đạt chuẩn")
    with patch("qbank.cli.get_store", return_value=store):
        ret = handle_set_status(args)
    assert ret == 0

    reloaded = store.get_question("q_status")
    assert reloaded.status == "approved"
    assert any("Kiểm tra đạt chuẩn" in n for n in reloaded.qa.notes)


def test_cli_recheck_downgrades_faulty_approved_questions(tmp_path):
    """recheck detects questions with out-of-level chars or solver ambiguity and downgrades approved to needs_review."""
    db_file = str(tmp_path / "test_qbank.db")
    store = QbStore(db_path=db_file)

    # 1. Question with out-of-level character 瓜 (HSK 3) in HSK 1 (evaluated on filled stem)
    q_xigua = make_test_question(
        "q_xigua",
        level=1,
        status="approved",
        stem="爸爸买了一个大西瓜，我和哥哥一人吃____。",
        options=["一半", "学校", "老师", "朋友"]
    )
    # 2. Question with solver ambiguity
    q_ambig = make_test_question(
        "q_ambig",
        level=1,
        status="approved",
        notes=["Solver flagged ambiguity: 2 options acceptable [0, 1]"]
    )
    # 3. Clean approved question with pure HSK 1 characters
    q_clean = make_test_question(
        "q_clean",
        level=1,
        status="approved",
        stem="今天天气很好，我和____一起去看书。",
        options=["老师", "同学", "朋友", "爸爸"]
    )
    # 4. Clean needs_review question (must NEVER be promoted)
    q_needs_rev = make_test_question(
        "q_needs_rev",
        level=1,
        status="needs_review",
        stem="明天天气很好，我和____一起去买书。",
        options=["老师", "同学", "朋友", "爸爸"]
    )

    store.save_question(q_xigua)
    store.save_question(q_ambig)
    store.save_question(q_clean)
    store.save_question(q_needs_rev)

    # A. Dry-run: does not change DB
    dry_args = argparse.Namespace(level=1, execute=False)
    with patch("qbank.cli.get_store", return_value=store):
        handle_recheck(dry_args)
    assert store.get_question("q_xigua").status == "approved"
    assert store.get_question("q_ambig").status == "approved"

    # B. Execute: downgrades faulty questions
    exec_args = argparse.Namespace(level=1, execute=True)
    with patch("qbank.cli.get_store", return_value=store):
        handle_recheck(exec_args)

    assert store.get_question("q_xigua").status == "needs_review"
    assert store.get_question("q_ambig").status == "needs_review"
    assert store.get_question("q_clean").status == "approved"
    assert store.get_question("q_needs_rev").status == "needs_review"  # NEVER promoted!


def test_sync_blocks_unhandled_solver_ambiguity_and_char_noise(tmp_path):
    """Bridge sync refuses questions with unhandled solver ambiguity or char noise even if status=approved."""
    db_file = str(tmp_path / "test_qbank.db")
    legacy_db = str(tmp_path / "legacy.db")
    with sqlite3.connect(legacy_db) as conn:
        conn.execute("CREATE TABLE questions (id TEXT PRIMARY KEY, hanzi_content TEXT, pinyin_text TEXT, options TEXT, correct_answer TEXT, explanation TEXT, ai_explanation TEXT, hsk_level INTEGER, topic TEXT, question_type TEXT, media_url TEXT, passage_id TEXT, source_url TEXT, content_hash TEXT, status TEXT);")

    store = QbStore(db_path=db_file)
    # Question with solver ambiguity and NO manual approval reason
    q_blocked = make_test_question(
        "q_blocked_sync",
        status="approved",
        stem="今天天气很好，我想去____看书。",
        notes=["Solver flagged ambiguity: 2 options acceptable [0, 1]"]
    )
    # Question with solver ambiguity BUT has manual review confirmation note
    q_confirmed = make_test_question(
        "q_confirmed_sync",
        status="approved",
        stem="明天天气很好，我想去____看书。",
        notes=["Solver flagged ambiguity: 2 options acceptable", "Người duyệt thủ công xác nhận: Câu hỏi có ngữ cảnh rõ ràng"]
    )
    store.save_question(q_blocked)
    store.save_question(q_confirmed)

    adapter = QbLegacyDBAdapter(sqlite_path=legacy_db)
    bridge = QbBridge(store=store, adapter=adapter)

    res = bridge.sync(execute=True)
    assert res.skipped_blocked_flags == 1
    assert any(b["question_id"] == "q_blocked_sync" for b in res.blocked_questions)
    assert res.synced_count == 1
    assert any(r["question_id"] == "q_confirmed_sync" for r in res.records)
