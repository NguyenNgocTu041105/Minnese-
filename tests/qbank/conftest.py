import os
import sys
import tempfile
import pytest

# Ensure project root is on sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from qbank.models import QbQuestion, QbProvenance, QbQA
from qbank.store import QbStore


@pytest.fixture(autouse=True)
def isolate_test_environment(monkeypatch):
    """
    Autouse fixture ensuring all tests run completely isolated:
    - Removes DATABASE_URL from os.environ
    - Patches qbank.bridge.check_postgres_available to return False without touching db/
    - Blocks all socket.connect calls to external IP addresses
    """
    monkeypatch.delenv("DATABASE_URL", raising=False)
    # Existing HTTP client tests use mocked requests; keep their provider settings explicit.
    monkeypatch.setenv("QBANK_LLM_FREE_ONLY", "false")
    monkeypatch.setenv("QBANK_LLM_ALLOW_PAID", "true")
    import qbank.bridge
    import qbank.config
    monkeypatch.setattr(qbank.bridge, "_bridge_postgres_available_cache", False)
    monkeypatch.setattr(qbank.bridge, "check_postgres_available", lambda: False)
    monkeypatch.setattr(qbank.config.qbank_config, "llm_fallback_models", "")

    # Block external network connections
    import socket
    orig_connect = socket.socket.connect
    orig_getaddrinfo = socket.getaddrinfo

    def guarded_connect(self, address):
        host = address[0] if isinstance(address, tuple) else address
        # Allow localhost / loopback only if needed, block all others
        if host not in ("127.0.0.1", "localhost", "::1"):
            raise ConnectionRefusedError(f"Mọi kết nối mạng ngoài ({host}) bị chặn trong môi trường kiểm thử!")
        return orig_connect(self, address)

    def guarded_getaddrinfo(host, port, *args, **kwargs):
        if host in ("127.0.0.1", "localhost", "::1", "generativelanguage.googleapis.com", "test.api.com"):
            return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('127.0.0.1', port or 443))]
        return orig_getaddrinfo(host, port, *args, **kwargs)

    monkeypatch.setattr(socket.socket, "connect", guarded_connect)
    monkeypatch.setattr(socket, "getaddrinfo", guarded_getaddrinfo)

    # Global Guard: Prevent QbVocabImporter from ever touching production data/ during tests
    import qbank.vocab_importer
    orig_importer_init = qbank.vocab_importer.QbVocabImporter.__init__
    test_tmp_dir = tempfile.mkdtemp(prefix="qbank_syllabus_guard_")

    def safe_importer_init(self, *args, **kwargs):
        if kwargs.get("target_vocab_path") is None:
            kwargs["target_vocab_path"] = os.path.join(test_tmp_dir, "vocab.jsonl")
        if kwargs.get("rejected_csv_path") is None:
            kwargs["rejected_csv_path"] = os.path.join(test_tmp_dir, "vocab_rejected.csv")
        orig_importer_init(self, *args, **kwargs)

    monkeypatch.setattr(qbank.vocab_importer.QbVocabImporter, "__init__", safe_importer_init)
    yield


@pytest.fixture
def temp_db_path():
    """Provides a temporary SQLite database file for testing."""
    import gc
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        path = f.name
    yield path
    gc.collect()
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass


@pytest.fixture
def test_store(temp_db_path):
    """Provides an isolated QbStore instance pointing to the temp database."""
    return QbStore(db_path=temp_db_path)


@pytest.fixture
def sample_question():
    """Creates a sample valid QbQuestion."""
    stem = "今天天气很好，我们一起去学校借书吧。"
    options = ["学校", "老师", "朋友", "准备"]
    answer_index = 0
    c_hash = QbQuestion.compute_hash(stem, options, answer_index)

    return QbQuestion(
        question_id="test-q-1001",
        level=1,
        skill="reading",
        part_type="reading_1",
        stem=stem,
        options=options,
        answer_index=answer_index,
        explanation_vi="Câu hỏi về nơi mượn sách. '学校' là đáp án đúng.",
        pinyin_stem="jīn tiān tiān qì hěn hǎo ， wǒ men yì qǐ qù xué xiào jiè shū ba 。",
        vocab_tags=["学校"],
        topic="education",
        difficulty="easy",
        display_label="Đề luyện tập theo chuẩn HSK 3.0",
        provenance=QbProvenance(
            origin="original_generated",
            batch_id="batch-001",
            prompt_version="1.0",
            llm_model="mock-llm",
            created_at="2026-10-11T00:00:00Z"
        ),
        qa=QbQA(
            structure_ok=True,
            level_ok=True,
            out_of_level_words=[],
            notes=[]
        ),
        status="needs_review",
        report_count=0,
        times_answered=0,
        times_wrong=0,
        content_hash=c_hash
    )


@pytest.fixture
def test_syllabus():
    """Provides an isolated QbSyllabus instance for testing using sample syllabus files."""
    from qbank.syllabus import QbSyllabus
    sample_vocab = os.path.join(
        os.path.dirname(__file__), "..", "..", "data", "qbank", "syllabus", "vocab.sample.jsonl"
    )
    sample_chars = os.path.join(
        os.path.dirname(__file__), "..", "..", "data", "qbank", "syllabus", "chars.sample.jsonl"
    )
    return QbSyllabus(vocab_file_path=sample_vocab, chars_file_path=sample_chars)


