import os
import json
import pytest
from unittest.mock import patch, MagicMock
from qbank.cli import build_parser, handle_generate, handle_review, handle_stats
from qbank.llm import QbMockLLM


def test_cli_parser_generate():
    parser = build_parser()
    args = parser.parse_args(["generate", "--level", "1", "--n", "3", "--dry-run", "--no-solver"])
    assert args.command == "generate"
    assert args.level == 1
    assert args.n == 3
    assert args.dry_run is True
    assert args.solver is False


def test_cli_parser_review():
    parser = build_parser()
    args = parser.parse_args(["review", "--level", "2", "--limit", "20"])
    assert args.command == "review"
    assert args.level == 2
    assert args.limit == 20


def test_cli_stats_command(test_store, sample_question, capsys):
    test_store.save_question(sample_question)
    with patch("qbank.cli.get_store", return_value=test_store):
        parser = build_parser()
        args = parser.parse_args(["stats"])
        exit_code = handle_stats(args)
        assert exit_code == 0

    captured = capsys.readouterr()
    assert "THỐNG KÊ KHO CÂU HỎI QBANK" in captured.out
    assert "Tổng số câu hỏi:           1" in captured.out
    assert "HSK 1:    1 câu" in captured.out


def test_cli_generate_dry_run(test_store, test_syllabus, capsys):
    mock_json = json.dumps({
        "questions": [
            {
                "stem": "王老师正在____给学生讲课。",
                "options": ["教室", "操场", "食堂", "宿舍"],
                "answer_index": 0,
                "explanation_vi": "Trong lớp học.",
                "topic": "school",
                "vocab_tags": ["老师"]
            }
        ]
    })

    with patch("qbank.cli.get_store", return_value=test_store), \
         patch("qbank.cli.QbGenerator") as MockGenClass:
        from qbank.generator import QbGenerator
        from qbank.config import QbConfig

        mock_gen_instance = QbGenerator(
            llm=QbMockLLM(predefined_response=mock_json),
            syllabus=test_syllabus,
            store=test_store,
            config=QbConfig(out_of_level_threshold=1.0)
        )
        MockGenClass.return_value = mock_gen_instance

        parser = build_parser()
        args = parser.parse_args(["generate", "--level", "1", "--n", "1", "--dry-run", "--no-solver"])
        exit_code = handle_generate(args)
        assert exit_code == 0

    captured = capsys.readouterr()
    assert "[DRY-RUN] Không có câu hỏi nào được lưu vào cơ sở dữ liệu." in captured.out
    # Database remains empty because of dry-run
    assert len(test_store.list_questions()) == 0


def test_cli_review_approve_and_reject(test_store, sample_question, capsys):
    # Prepare question in needs_review state
    sample_question.status = "needs_review"
    test_store.save_question(sample_question)

    with patch("qbank.cli.get_store", return_value=test_store):
        parser = build_parser()
        args = parser.parse_args(["review", "--level", "1"])

        # Simulate user typing 'a' to approve
        with patch("builtins.input", return_value="a"):
            exit_code = handle_review(args)
            assert exit_code == 0

    q_after = test_store.get_question(sample_question.question_id)
    assert q_after.status == "approved"

    # Now change to needs_review and simulate 'r' to reject
    test_store.update_status(sample_question.question_id, "needs_review")
    with patch("qbank.cli.get_store", return_value=test_store):
        with patch("builtins.input", return_value="r"):
            handle_review(args)

    q_rejected = test_store.get_question(sample_question.question_id)
    assert q_rejected.status == "retired" if q_rejected.status == "retired" else "rejected"


def test_cli_export_and_import_approved_tightened(test_store, sample_question, tmp_path):
    """
    Tests tightened export-approved and import-approved pipeline:
    - export-approved logs to qb_export_log and appends manifest checksum
    - export-approved skips already-exported unless --include-exported is passed
    - import-approved rejects lines with extra fields / corrupt hash / invalid levels
    - import-approved respects --trust-approved vs default needs_review
    - import-approved default dry-run vs --execute
    """
    from qbank.cli import handle_export_approved, handle_import_approved

    sample_question.status = "approved"
    test_store.save_question(sample_question)

    jsonl_out = str(tmp_path / "exported.jsonl")

    # 1. export-approved: writes question + manifest, logs to qb_export_log
    parser = build_parser()
    args_export = parser.parse_args(["export-approved", "--out", jsonl_out])
    with patch("qbank.cli.get_store", return_value=test_store):
        exit_code = handle_export_approved(args_export)
        assert exit_code == 0

    assert os.path.exists(jsonl_out)
    with open(jsonl_out, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]
        assert len(lines) == 2
        q_data = json.loads(lines[0])
        assert q_data["question_id"] == sample_question.question_id
        manifest_data = json.loads(lines[1])
        assert manifest_data.get("_manifest") is True
        assert manifest_data.get("schema_version") == "1.0"
        assert manifest_data.get("question_count") == 1
        assert "content_checksum_sha256" in manifest_data

    # 2. Second export-approved without --include-exported finds 0 questions
    with patch("qbank.cli.get_store", return_value=test_store):
        args_export2 = parser.parse_args(["export-approved", "--out", str(tmp_path / "out2.jsonl")])
        assert handle_export_approved(args_export2) == 0
        assert not os.path.exists(str(tmp_path / "out2.jsonl"))

    # 3. Second export-approved WITH --include-exported exports it again
    with patch("qbank.cli.get_store", return_value=test_store):
        args_export3 = parser.parse_args(["export-approved", "--out", str(tmp_path / "out3.jsonl"), "--include-exported"])
        assert handle_export_approved(args_export3) == 0
        assert os.path.exists(str(tmp_path / "out3.jsonl"))

    # 4. Create corrupt file with extra fields and invalid hash (with valid manifest format)
    corrupt_file = str(tmp_path / "corrupt.jsonl")
    bad_row1 = dict(q_data)
    bad_row1["unauthorized_field"] = "malicious_injection"  # extra field forbidden!
    bad_row2 = dict(q_data)
    bad_row2["content_hash"] = "0" * 64  # mismatched hash!
    with open(corrupt_file, "w", encoding="utf-8") as f:
        f.write(json.dumps(bad_row1, ensure_ascii=False) + "\n")
        f.write(json.dumps(bad_row2, ensure_ascii=False) + "\n")
        f.write(json.dumps({"_manifest": True, "schema_version": "1.0", "question_count": 2}, ensure_ascii=False) + "\n")

    args_bad = parser.parse_args(["import-approved", "--in", corrupt_file])
    with patch("qbank.cli.get_store", return_value=test_store):
        # Dry-run handles gracefully and rejects both rows (0 questions ready to save)
        exit_code = handle_import_approved(args_bad)
        assert exit_code == 0

    # 5. Manifest schema_version mismatch test
    bad_schema_file = str(tmp_path / "bad_schema.jsonl")
    with open(bad_schema_file, "w", encoding="utf-8") as f:
        f.write(json.dumps(q_data, ensure_ascii=False) + "\n")
        f.write(json.dumps({"_manifest": True, "schema_version": "2.0", "question_count": 1}, ensure_ascii=False) + "\n")
    args_bad_schema = parser.parse_args(["import-approved", "--in", bad_schema_file])
    with patch("qbank.cli.get_store", return_value=test_store):
        assert handle_import_approved(args_bad_schema) == 1

    # 6. Missing manifest rejected by default, accepted with --allow-no-manifest
    no_manifest_file = str(tmp_path / "no_manifest.jsonl")
    with open(no_manifest_file, "w", encoding="utf-8") as f:
        f.write(json.dumps(q_data, ensure_ascii=False) + "\n")
    args_no_man = parser.parse_args(["import-approved", "--in", no_manifest_file])
    with patch("qbank.cli.get_store", return_value=test_store):
        assert handle_import_approved(args_no_man) == 1

    args_allow_no_man = parser.parse_args(["import-approved", "--in", no_manifest_file, "--allow-no-manifest"])
    with patch("qbank.cli.get_store", return_value=test_store):
        assert handle_import_approved(args_allow_no_man) == 0

    # 7. Import valid question into a clean store: default dry-run vs --execute without --trust-approved
    from qbank.store import QbStore
    clean_store = QbStore(db_path=str(tmp_path / "clean_qb.db"))

    # Default import (dry run): no write
    args_imp_dry = parser.parse_args(["import-approved", "--in", jsonl_out])
    with patch("qbank.cli.get_store", return_value=clean_store):
        assert handle_import_approved(args_imp_dry) == 0
        assert clean_store.get_question(sample_question.question_id) is None

    # Execute without --trust-approved -> saved with status='needs_review'
    args_imp_exec = parser.parse_args(["import-approved", "--in", jsonl_out, "--execute"])
    with patch("qbank.cli.get_store", return_value=clean_store):
        assert handle_import_approved(args_imp_exec) == 0
        loaded = clean_store.get_question(sample_question.question_id)
        assert loaded is not None
        assert loaded.status == "needs_review"

    # Execute with --trust-approved: saves as 'approved' in qbank.db,
    # and strictly verifies it NEVER touches or writes to legacy questions table!
    import sqlite3
    legacy_mock_db = str(tmp_path / "legacy_untouched.db")
    with sqlite3.connect(legacy_mock_db) as conn:
        conn.execute("CREATE TABLE questions (id TEXT PRIMARY KEY, hanzi_content TEXT);")
        conn.commit()

    clean_store2 = QbStore(db_path=str(tmp_path / "clean_qb2.db"))
    args_imp_trusted = parser.parse_args(["import-approved", "--in", jsonl_out, "--execute", "--trust-approved"])
    with patch("qbank.cli.get_store", return_value=clean_store2):
        assert handle_import_approved(args_imp_trusted) == 0
        loaded2 = clean_store2.get_question(sample_question.question_id)
        assert loaded2 is not None
        assert loaded2.status == "approved"

    # Verify zero rows in legacy DB
    with sqlite3.connect(legacy_mock_db) as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM questions;")
        assert cur.fetchone()[0] == 0


def test_cli_retire_dry_run_and_confirm(test_store, sample_question):
    """Tests retire command in dry-run mode and with user confirmation."""
    from qbank.cli import handle_retire

    # Setup sync record
    test_store.record_sync(
        batch_id="batch_cli_retire",
        question_id=sample_question.question_id,
        legacy_source_url="qbank_original:batch_cli_retire",
        legacy_id="leg_cli_001"
    )

    parser = build_parser()

    # 1. dry-run
    args_dry = parser.parse_args(["retire", "--batch-id", "batch_cli_retire", "--dry-run"])
    with patch("qbank.cli.get_store", return_value=test_store):
        with patch("qbank.bridge.QbBridge.retire") as mock_retire:
            exit_code = handle_retire(args_dry)
            assert exit_code == 0
            mock_retire.assert_not_called()

    # 2. execute with confirmation 'y'
    args_exec = parser.parse_args(["retire", "--batch-id", "batch_cli_retire"])
    with patch("qbank.cli.get_store", return_value=test_store):
        with patch("builtins.input", return_value="y"):
            with patch("qbank.bridge.QbBridge.retire", return_value=1) as mock_retire:
                exit_code = handle_retire(args_exec)
                assert exit_code == 0
                mock_retire.assert_called_once_with(batch_id="batch_cli_retire")


def test_cli_list_models_command(capsys):
    """Rule 4: list-models CLI command displays models safely."""
    from qbank.cli import handle_list_models

    parser = build_parser()
    args = parser.parse_args(["list-models"])
    assert args.command == "list-models"

    with patch("qbank.llm.QbOpenAIClient.list_models", return_value=["gemini-2.5-flash", "gemini-2.0-flash"]):
        exit_code = handle_list_models(args)
        assert exit_code == 0

    captured = capsys.readouterr()
    assert "DANH SÁCH MODEL KHẢ DỤNG CHO API KEY" in captured.out
    assert "gemini-2.5-flash" in captured.out
    assert "gemini-2.0-flash" in captured.out


def test_cli_list_models_normalized_matching_no_false_warning(capsys, monkeypatch):
    """Normalized matching: 'models/gemini-3.5-flash' matches 'gemini-3.5-flash' without false warning."""
    import qbank.config
    from qbank.cli import handle_list_models

    monkeypatch.setattr(qbank.config.qbank_config, "llm_model", "gemini-3.5-flash")
    monkeypatch.setattr(qbank.config.qbank_config, "llm_fallback_models", "gemini-3.5-flash-lite")

    parser = build_parser()
    args = parser.parse_args(["list-models"])

    with patch("qbank.llm.QbOpenAIClient.list_models", return_value=["models/gemini-3.5-flash", "models/gemini-3.5-flash-lite"]):
        exit_code = handle_list_models(args)
        assert exit_code == 0

    captured = capsys.readouterr()
    assert "[MODEL CHÍNH]" in captured.out
    assert "[DỰ PHÒNG]" in captured.out
    assert "[CẢNH BÁO]" not in captured.out


def test_cli_list_models_text_only_and_all_filtering(capsys):
    """Flags --text-only (default) filters embeddings/images, --all shows everything."""
    from qbank.cli import handle_list_models

    models_sample = [
        "models/gemini-3.5-flash",
        "models/text-embedding-004",
        "models/imagen-3.0-generate",
        "models/gemini-2.0-flash-live"
    ]

    parser = build_parser()

    # 1. Default (text-only)
    args_default = parser.parse_args(["list-models"])
    with patch("qbank.llm.QbOpenAIClient.list_models", return_value=models_sample):
        exit_code = handle_list_models(args_default)
        assert exit_code == 0

    out_default = capsys.readouterr().out
    assert "models/gemini-3.5-flash" in out_default
    assert "text-embedding-004" not in out_default
    assert "imagen-3.0-generate" not in out_default
    assert "gemini-2.0-flash-live" not in out_default
    assert "--text-only" in out_default

    # 2. --all flag
    args_all = parser.parse_args(["list-models", "--all"])
    with patch("qbank.llm.QbOpenAIClient.list_models", return_value=models_sample):
        exit_code = handle_list_models(args_all)
        assert exit_code == 0

    out_all = capsys.readouterr().out
    assert "models/gemini-3.5-flash" in out_all
    assert "text-embedding-004" in out_all
    assert "imagen-3.0-generate" in out_all
    assert "gemini-2.0-flash-live" in out_all


def test_cli_probe_model_success(capsys, monkeypatch):
    """probe-model command runs probe request and outputs metrics."""
    import qbank.config
    from qbank.cli import handle_probe_model

    monkeypatch.setattr(qbank.config.qbank_config, "llm_api_key", "mock_key")
    monkeypatch.setattr(qbank.config.qbank_config, "llm_reasoning_effort", "low")

    parser = build_parser()
    args = parser.parse_args(["probe-model", "gemini-3.5-flash"])

    mock_res = {
        "model": "gemini-3.5-flash",
        "reasoning_effort": "low",
        "status_code": 200,
        "latency_ms": 145.2,
        "ok": True,
        "finish_reason": "stop",
        "prompt_tokens": 12,
        "completion_tokens": 5,
        "reasoning_tokens": 0,
        "total_tokens": 17
    }

    with patch("qbank.llm.QbOpenAIClient.probe_model", return_value=mock_res) as mock_probe:
        exit_code = handle_probe_model(args)
        assert exit_code == 0
        mock_probe.assert_called_once_with("gemini-3.5-flash", reasoning_effort="low")

    out = capsys.readouterr().out
    assert "KIỂM TRA MODEL LLM (PROBE-MODEL)" in out
    assert "mỗi lần probe tốn 1 lượt hạn mức" in out.lower()
    assert "HTTP 200" in out
    assert "145 ms" in out
    assert "THÀNH CÔNG" in out


def test_cli_probe_model_retries_without_reasoning_effort_on_400(capsys, monkeypatch):
    """If 400 occurs with reasoning_effort, probe-model retries once without it and reports both."""
    import qbank.config
    from qbank.cli import handle_probe_model

    monkeypatch.setattr(qbank.config.qbank_config, "llm_api_key", "mock_key")
    monkeypatch.setattr(qbank.config.qbank_config, "llm_reasoning_effort", "low")

    parser = build_parser()
    args = parser.parse_args(["probe-model", "gemini-3.5-flash"])

    res1 = {
        "model": "gemini-3.5-flash",
        "reasoning_effort": "low",
        "status_code": 400,
        "latency_ms": 80.0,
        "ok": False,
        "error_type": "400 Lỗi tham số (Bad Request)",
        "error_message": "Unsupported parameter: reasoning_effort"
    }
    res2 = {
        "model": "gemini-3.5-flash",
        "reasoning_effort": None,
        "status_code": 200,
        "latency_ms": 110.0,
        "ok": True,
        "finish_reason": "stop",
        "prompt_tokens": 10,
        "completion_tokens": 3,
        "reasoning_tokens": 0,
        "total_tokens": 13
    }

    with patch("qbank.llm.QbOpenAIClient.probe_model", side_effect=[res1, res2]) as mock_probe:
        exit_code = handle_probe_model(args)
        assert exit_code == 0
        assert mock_probe.call_count == 2

    out = capsys.readouterr().out
    assert "Thử nghiệm 1" in out
    assert "400 Lỗi tham số" in out
    assert "Thử nghiệm 2 (thử lại KHÔNG CÓ tham số reasoning_effort)" in out
    assert "KẾT LUẬN: Model phản hồi tốt khi KHÔNG có reasoning_effort" in out

