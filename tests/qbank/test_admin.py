import os
import io
import json
import hashlib
import sqlite3
import pytest
from unittest.mock import patch

from qbank.admin.app import create_app, sanitize_text
from qbank.admin.__main__ import is_port_in_use
from qbank.store import QbStore
from qbank.models import QbQuestion


@pytest.fixture
def admin_client(tmp_path, monkeypatch):
    """Creates a test client for the admin app with an isolated temporary store."""
    db_file = tmp_path / "test_admin_qbank.db"
    store = QbStore(db_path=str(db_file))
    monkeypatch.setattr("qbank.admin.routes.get_store", lambda: store)

    app = create_app(port=8080)
    app.config["TESTING"] = True
    app.config["SERVER_NAME"] = "127.0.0.1:8080"
    return app.test_client(), store, app


def test_admin_config_security_defaults(admin_client):
    client, store, app = admin_client
    assert app.config["DEBUG"] is False
    assert app.config["SESSION_COOKIE_HTTPONLY"] is True
    assert app.config["SESSION_COOKIE_SAMESITE"] == "Strict"
    assert app.config["MAX_CONTENT_LENGTH"] == 15 * 1024 * 1024
    assert len(app.secret_key) >= 32


def test_admin_rejects_strange_host_header(admin_client):
    client, store, app = admin_client
    # Allowed host
    res_ok = client.get("/")
    assert res_ok.status_code == 200

    # Strange host header (e.g. DNS rebinding attack)
    res_bad = client.get("/", headers={"Host": "attacker.com"})
    assert res_bad.status_code == 403



def test_admin_rejects_non_loopback_remote_ip(admin_client):
    client, store, app = admin_client
    # Simulate request from public IP
    res = client.get("/", environ_overrides={"REMOTE_ADDR": "192.168.1.50"})
    assert res.status_code == 403


def test_admin_csrf_protection_and_origin(admin_client):
    client, store, app = admin_client

    # 1. Preset valid CSRF token in session
    with client.session_transaction() as sess:
        sess["csrf_token"] = "valid_csrf_token_abc123"

    # 2. POST without CSRF token -> Rejected 403
    res_no_token = client.post(
        "/review",
        data={"action": "approve", "question_id": "test_1"},
        headers={"Host": "127.0.0.1:8080"}
    )
    assert res_no_token.status_code == 403

    # 3. POST with foreign Origin -> Rejected 403
    res_bad_origin = client.post(
        "/review",
        data={"csrf_token": "valid_csrf_token_abc123", "action": "approve", "question_id": "test_1"},
        headers={"Host": "127.0.0.1:8080", "Origin": "http://evil-site.com"}
    )
    assert res_bad_origin.status_code == 403

    # 4. POST with valid CSRF token and valid Origin/Host -> Allowed (passes security check)
    res_good = client.post(
        "/review",
        data={"csrf_token": "valid_csrf_token_abc123", "action": "skip", "question_id": "test_1"},
        headers={"Host": "127.0.0.1:8080", "Origin": "http://127.0.0.1:8080"},
        follow_redirects=True
    )
    assert res_good.status_code == 200


def test_admin_sanitize_text_redacts_credentials():
    dirty_pg = "Error connecting to postgresql://admin:my_secret_pass@10.0.0.1:5432/hsk_db while reading"
    clean_pg = sanitize_text(dirty_pg)
    assert "my_secret_pass" not in clean_pg
    assert "[REDACTED_DATABASE_URL]" in clean_pg

    with patch.dict(os.environ, {"QBANK_LLM_API_KEY": "AIzaSySecretApiKey12345"}):
        dirty_key = "Failed request with key AIzaSySecretApiKey12345 in header"
        clean_key = sanitize_text(dirty_key)
        assert "AIzaSySecretApiKey12345" not in clean_key
        assert "[REDACTED_API_KEY]" in clean_key


def test_admin_vocab_preview_dry_run_does_not_write(admin_client, tmp_path, monkeypatch):
    client, store, app = admin_client
    target_vocab = tmp_path / "vocab.jsonl"

    # Simple CSV content
    csv_bytes = b"word,pinyin,level\n\xe7\x8c\xab,m\xc4\x81o,1\n"

    with client.session_transaction() as sess:
        sess["csrf_token"] = "valid_token_123"

    # Missing license_status should fail validation
    res_no_license = client.post(
        "/vocab",
        data={
            "csrf_token": "valid_token_123",
            "action": "preview",
            "source": "Test Source",
            "license_status": "",
            "file": (io.BytesIO(csv_bytes), "vocab.csv")
        },
        headers={"Host": "127.0.0.1:8080", "Origin": "http://127.0.0.1:8080"},
        follow_redirects=True
    )
    assert res_no_license.status_code == 200
    assert "trạng thái bản quyền" in res_no_license.get_data(as_text=True)


def test_admin_review_actions(admin_client):
    client, store, app = admin_client

    # Seed a question in needs_review
    q = QbQuestion(
        question_id="admin_test_q1",
        level=1,
        skill="reading",
        part_type="fill_blank",
        stem="我是____人。",
        options=["中国", "英国", "法国", "日本"],
        answer_index=0,
        explanation_vi="Tôi là người Trung Quốc.",
        provenance={"batch_id": "b1", "prompt_version": "v1", "llm_model": "mock", "created_at": "now"},
        qa={"notes": ["ok"]},
        status="needs_review",
        content_hash=QbQuestion.compute_hash("我是____人。", ["中国", "英国", "法国", "日本"], 0)
    )
    store.save_question(q)

    with client.session_transaction() as sess:
        sess["csrf_token"] = "valid_token_review"

    # Check question is in review view
    res = client.get("/review?level=1", headers={"Host": "127.0.0.1:8080"})
    assert "admin_test_q1" in res.get_data(as_text=True)

    # Approve question
    res_approve = client.post(
        "/review",
        data={"csrf_token": "valid_token_review", "action": "approve", "question_id": "admin_test_q1"},
        headers={"Host": "127.0.0.1:8080", "Origin": "http://127.0.0.1:8080"},
        follow_redirects=True
    )
    assert res_approve.status_code == 200
    updated = store.get_question("admin_test_q1")
    assert updated.status == "approved"


def test_admin_sync_count_confirmation_guard(admin_client):
    client, store, app = admin_client

    with client.session_transaction() as sess:
        sess["csrf_token"] = "valid_token_sync"

    # Try sync execute with mismatch count confirmation
    res_sync = client.post(
        "/sync",
        data={
            "csrf_token": "valid_token_sync",
            "action": "sync_execute",
            "expected_count": "10",
            "confirm_count": "5"  # Mismatch!
        },
        headers={"Host": "127.0.0.1:8080", "Origin": "http://127.0.0.1:8080"},
        follow_redirects=True
    )
    assert res_sync.status_code == 200
    assert "không khớp" in res_sync.get_data(as_text=True)


def test_admin_vocab_preview_then_confirm_execute(admin_client, tmp_path, monkeypatch):
    client, store, app = admin_client
    target_vocab = tmp_path / "vocab_exec.jsonl"
    rej_csv = tmp_path / "vocab_rej.csv"

    # Patch default target paths in QbVocabImporter so it writes to tmp_path
    from qbank import vocab_importer
    orig_importer_init = vocab_importer.QbVocabImporter.__init__

    def patched_init(self, *args, **kwargs):
        kwargs["target_vocab_path"] = str(target_vocab)
        kwargs["rejected_csv_path"] = str(rej_csv)
        orig_importer_init(self, *args, **kwargs)

    monkeypatch.setattr(vocab_importer.QbVocabImporter, "__init__", patched_init)

    csv_bytes = "word,pinyin,level\n猫,māo,1\n".encode("utf-8")

    with client.session_transaction() as sess:
        sess["csrf_token"] = "valid_token_vocab"

    # Step 1: Preview action (Dry-Run)
    res_preview = client.post(
        "/vocab",
        data={
            "csrf_token": "valid_token_vocab",
            "action": "preview",
            "source": "Mock Source",
            "license_status": "permitted",
            "file": (io.BytesIO(csv_bytes), "words.csv")
        },
        follow_redirects=True
    )
    assert res_preview.status_code == 200
    assert "KẾT QUẢ XEM TRƯỚC" in res_preview.get_data(as_text=True)
    # File must NOT exist yet!
    assert not target_vocab.exists()

    # Step 2: Confirm execute action
    res_exec = client.post(
        "/vocab",
        data={
            "csrf_token": "valid_token_vocab",
            "action": "execute",
            "source": "Mock Source",
            "license_status": "permitted",
            "mode": "merge"
        },
        follow_redirects=True
    )
    assert res_exec.status_code == 200
    assert "Thực thi thành công" in res_exec.get_data(as_text=True)
    # File MUST now exist with written words!
    assert target_vocab.exists()
    lines = [json.loads(l) for l in target_vocab.read_text(encoding="utf-8").splitlines() if l.strip()]
    assert len(lines) == 1
    assert lines[0]["word"] == "猫"




def test_admin_port_in_use_detection():
    import socket
    # Open a real socket to simulate occupied port
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        occupied_port = s.getsockname()[1]
        assert is_port_in_use("127.0.0.1", occupied_port) is True


def test_real_db_integrity_preserved():
    # Verify data/hsk_exam.db hash has not changed
    db_path = "data/hsk_exam.db"
    assert os.path.exists(db_path)
    with open(db_path, "rb") as f:
        current_hash = hashlib.sha256(f.read()).hexdigest()
    assert current_hash == "10255bccdf641545f649641912c0982b02600e74b5ccee1229ff03faa8ed66dd"
