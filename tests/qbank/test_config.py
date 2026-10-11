import os
from unittest.mock import patch
from qbank.config import QbConfig


def test_config_only_reads_qbank_llm_api_key():
    """Verifies that config strictly reads QBANK_LLM_API_KEY and never fallbacks to other keys."""
    with patch.dict(os.environ, {
        "QBANK_LLM_API_KEY": "specific-qbank-key-123",
        "GEMINI_API_KEY": "gemini-old-key",
        "OPENAI_API_KEY": "openai-old-key"
    }, clear=False):
        cfg = QbConfig()
        assert cfg.llm_api_key == "specific-qbank-key-123"

    with patch.dict(os.environ, {
        "QBANK_LLM_API_KEY": "",
        "GEMINI_API_KEY": "gemini-old-key",
        "OPENAI_API_KEY": "openai-old-key"
    }, clear=False):
        cfg = QbConfig()
        assert cfg.llm_api_key == "" or cfg.llm_api_key is None
        assert cfg.llm_api_key != "gemini-old-key"
        assert cfg.llm_api_key != "openai-old-key"


def test_config_defaults():
    cfg = QbConfig()
    assert "openai" in cfg.llm_base_url.lower() or "google" in cfg.llm_base_url.lower()
    assert cfg.max_calls_per_run >= 1
    assert cfg.batch_size >= 1
    assert os.path.isabs(cfg.db_path)


def test_config_path_resolution():
    from qbank.config import resolve_project_path, PROJECT_ROOT
    rel_path = "data/qbank/custom.db"
    resolved = resolve_project_path(rel_path)
    assert os.path.isabs(resolved)
    assert resolved == os.path.abspath(os.path.join(PROJECT_ROOT, rel_path))

    # Passing relative path into QbConfig sets absolute path
    cfg = QbConfig(db_path=rel_path)
    assert os.path.isabs(cfg.db_path)
    assert cfg.db_path == resolved

