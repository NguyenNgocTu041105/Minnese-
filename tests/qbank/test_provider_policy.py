import pytest
from unittest.mock import patch

from qbank.config import QbConfig, assert_free_only_provider
from qbank.generator import QbGenerator
from qbank.llm import QbOpenAIClient


def test_python_generator_blocks_unverified_provider_before_completion(
    monkeypatch, test_store, test_syllabus
):
    monkeypatch.setenv("QBANK_LLM_FREE_ONLY", "true")
    monkeypatch.setenv("QBANK_LLM_ALLOW_PAID", "false")
    client = QbOpenAIClient(
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        api_key="synthetic-test-key",
    )
    called = False

    def unexpected_completion(*args, **kwargs):
        nonlocal called
        called = True
        raise AssertionError("Provider request must be blocked before completion.")

    monkeypatch.setattr(client, "generate_chat_completion", unexpected_completion)
    generator = QbGenerator(
        llm=client,
        syllabus=test_syllabus,
        store=test_store,
        config=QbConfig(db_path=str(test_store.db_path)),
    )

    with pytest.raises(RuntimeError, match="only the verified free Groq HTTPS endpoint"):
        generator.generate(level=1, count=1, use_solver=False, dry_run=True)

    assert called is False


def test_python_generator_accepts_verified_groq_endpoint(monkeypatch):
    monkeypatch.setenv("QBANK_LLM_FREE_ONLY", "true")
    monkeypatch.setenv("QBANK_LLM_ALLOW_PAID", "false")

    assert_free_only_provider("https://api.groq.com/openai/v1")


@pytest.mark.parametrize(
    ("method_name", "args"),
    [
        ("list_models", ()),
        ("probe_model", ("synthetic-model",)),
        ("generate_chat_completion", ([{"role": "user", "content": "synthetic"}],)),
    ],
)
def test_python_http_client_blocks_unverified_host_before_httpx(
    monkeypatch, method_name, args
):
    monkeypatch.setenv("QBANK_LLM_FREE_ONLY", "true")
    monkeypatch.setenv("QBANK_LLM_ALLOW_PAID", "false")
    client = QbOpenAIClient(
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        api_key="synthetic-test-key",
    )

    with patch("qbank.llm.httpx.Client") as http_client:
        with pytest.raises(RuntimeError, match="only the verified free Groq HTTPS endpoint"):
            getattr(client, method_name)(*args)
        http_client.assert_not_called()


@pytest.mark.parametrize(
    ("free_only", "allow_paid"),
    [("false", "false"), ("true", "true")],
)
def test_python_generator_blocks_policy_mismatch(monkeypatch, free_only, allow_paid):
    monkeypatch.setenv("QBANK_LLM_FREE_ONLY", free_only)
    monkeypatch.setenv("QBANK_LLM_ALLOW_PAID", allow_paid)

    with pytest.raises(RuntimeError, match="QBANK_LLM_FREE_ONLY=true"):
        assert_free_only_provider("https://api.groq.com/openai/v1")
