import os
import json
import pytest
from unittest.mock import patch

from qbank.models import QbQuestion, QbProvenance, QbQA
from qbank.store import QbStore
from qbank.cli import handle_review, handle_set_status, handle_recheck
import argparse


def make_test_question(qid: str, level: int = 1, status: str = "needs_review", stem: str = "今天天气很好，我想去____借书。", options: list = None, notes: list = None):
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


def test_review_hard_blocks_char_noise(tmp_path, monkeypatch, capsys):
    """Questions with char_noise strictly forbid approval 'a'."""
    db_file = str(tmp_path / "test_qbank.db")
    store = QbStore(db_path=db_file)
    q = make_test_question("q_noise", stem="今天天气很好(rất tốt)，我想去____借书。", notes=["chữ_nhiễu: chứa tiếng Việt"])
    store.save_question(q)

    # User attempts 'a' (blocked), then 's' (skip)
    inputs = iter(["a", "s"])
    monkeypatch.setattr("builtins.input", lambda prompt="": next(inputs))

    with patch("qbank.cli.get_store", return_value=store):
        args = argparse.Namespace(level=1, limit=10, batch_id=None, since=None, flagged_only=False)
        handle_review(args)

    out = capsys.readouterr().out
    assert "TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP DUYỆT CÂU NÀY" in out
    # Verify status is still needs_review
    reloaded = store.get_question("q_noise")
    assert reloaded.status == "needs_review"


def test_review_requires_duyet_and_reason_for_critical_flags(tmp_path, monkeypatch, capsys):
    """Questions with solver_ambiguity require typing 'duyet' and providing a reason."""
    db_file = str(tmp_path / "test_qbank.db")
    store = QbStore(db_path=db_file)
    q = make_test_question("q_solver", notes=["Solver flagged ambiguity: 2 options acceptable [0, 1]"])
    store.save_question(q)

    # First attempt: enters 'a', then fails confirmation by typing 'yes' -> canceled
    # Second attempt: enters 'a', types 'duyet', provides reason 'Đã kiểm tra ngữ cảnh rõ ràng'
    inputs = iter(["a", "yes", "a", "duyet", "Đã kiểm tra ngữ cảnh rõ ràng"])
    monkeypatch.setattr("builtins.input", lambda prompt="": next(inputs))

    with patch("qbank.cli.get_store", return_value=store):
        args = argparse.Namespace(level=1, limit=10, batch_id=None, since=None, flagged_only=False)
        handle_review(args)

    out = capsys.readouterr().out
    assert "BẮT BUỘC phải gõ chính xác từ 'duyet'" in out
    assert "Đã hủy duyệt câu này" in out
    assert "Đã duyệt với lý do xác nhận" in out

    reloaded = store.get_question("q_solver")
    assert reloaded.status == "approved"
    assert any("Đã kiểm tra ngữ cảnh rõ ràng" in n for n in reloaded.qa.notes)


def test_review_clean_question_approved_immediately(tmp_path, monkeypatch):
    """Clean questions with no critical flags are approved with a single 'a'."""
    db_file = str(tmp_path / "test_qbank.db")
    store = QbStore(db_path=db_file)
    q = make_test_question("q_clean", notes=["Cấu trúc: OK", "Cấp độ từ vựng: OK"])
    store.save_question(q)

    inputs = iter(["a"])
    monkeypatch.setattr("builtins.input", lambda prompt="": next(inputs))

    with patch("qbank.cli.get_store", return_value=store):
        args = argparse.Namespace(level=1, limit=10, batch_id=None, since=None, flagged_only=False)
        handle_review(args)

    reloaded = store.get_question("q_clean")
    assert reloaded.status == "approved"


def test_review_interactive_edit(tmp_path, monkeypatch):
    """Key 'e' allows editing stem and options, updating content hash and adding note."""
    db_file = str(tmp_path / "test_qbank.db")
    store = QbStore(db_path=db_file)
    q = make_test_question("q_edit", stem="这是____错句。")
    store.save_question(q)

    # User enters 'e', inputs new stem, keeps options, changes answer to 0, then 's' (skip)
    inputs = iter([
        "e",
        "今天天气很好，我想去____借书。",  # new stem
        "学校", "", "", "",               # new options (first changed, rest kept)
        "0",                               # answer index
        "s"                                # skip to finish
    ])
    monkeypatch.setattr("builtins.input", lambda prompt="": next(inputs))

    with patch("qbank.cli.get_store", return_value=store):
        args = argparse.Namespace(level=1, limit=10, batch_id=None, since=None, flagged_only=False)
        handle_review(args)

    reloaded = store.get_question("q_edit")
    assert reloaded.stem == "今天天气很好，我想去____借书。"
    assert any("Đã chỉnh sửa thủ công" in n for n in reloaded.qa.notes)


def test_review_interactive_level_change(tmp_path, monkeypatch):
    """Key 'l' allows changing HSK level with confirmation."""
    db_file = str(tmp_path / "test_qbank.db")
    store = QbStore(db_path=db_file)
    q = make_test_question("q_lvl", level=1)
    store.save_question(q)

    # User enters 'l', selects level 2, confirms 'y', then skips 's'
    inputs = iter(["l", "2", "y", "s"])
    monkeypatch.setattr("builtins.input", lambda prompt="": next(inputs))

    with patch("qbank.cli.get_store", return_value=store):
        args = argparse.Namespace(level=1, limit=10, batch_id=None, since=None, flagged_only=False)
        handle_review(args)

    reloaded = store.get_question("q_lvl")
    assert reloaded.level == 2
    assert any("Đã đổi cấp độ sang HSK 2" in n for n in reloaded.qa.notes)


def test_review_interactive_undo(tmp_path, monkeypatch):
    """Key 'u' reverts the previous decision in session."""
    db_file = str(tmp_path / "test_qbank.db")
    store = QbStore(db_path=db_file)
    q1 = make_test_question("q_undo_1", stem="今天天气很好，我想去____借书。")
    q2 = make_test_question("q_undo_2", stem="明天天气很好，我想去____看书。")
    store.save_question(q1)
    store.save_question(q2)

    # For q1: approve ('a'). For q2: undo ('u') -> reverts q1 back to needs_review, then 'q' to quit
    inputs = iter(["a", "u", "q"])
    monkeypatch.setattr("builtins.input", lambda prompt="": next(inputs))

    with patch("qbank.cli.get_store", return_value=store):
        args = argparse.Namespace(level=1, limit=10, batch_id=None, since=None, flagged_only=False)
        handle_review(args)

    assert store.get_question("q_undo_1").status == "needs_review"
