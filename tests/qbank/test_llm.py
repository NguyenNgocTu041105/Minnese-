import json
import httpx
import pytest
from qbank.llm import QbMockLLM, QbOpenAIClient


def test_mock_llm_deterministic_output():
    mock = QbMockLLM()
    res = mock.generate_chat_completion([{"role": "user", "content": "generate questions"}])
    assert mock.calls_count == 1
    data = json.loads(res)
    assert "questions" in data
    assert len(data["questions"]) == 2
    q1 = data["questions"][0]
    assert "stem" in q1
    assert "options" in q1
    assert len(q1["options"]) == 4


def test_openai_client_rejects_missing_api_key(monkeypatch):
    import qbank.config
    monkeypatch.setattr(qbank.config.qbank_config, "llm_api_key", None)
    client = QbOpenAIClient(api_key=None)
    with pytest.raises(ValueError, match="QBANK_LLM_API_KEY is missing"):
        client.generate_chat_completion([{"role": "user", "content": "hello"}])


def test_openai_client_truncated_output(monkeypatch):
    from unittest.mock import MagicMock
    from qbank.llm import QbTruncatedOutput

    client = QbOpenAIClient(api_key="test_key")

    # Case 1: finish_reason == 'length'
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "choices": [{"finish_reason": "length", "message": {"content": "Incomplete text..."}}]
    }

    mock_http_client = MagicMock()
    mock_http_client.__enter__.return_value.post.return_value = mock_resp
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http_client)

    with pytest.raises(QbTruncatedOutput, match="finish_reason='length'"):
        client.generate_chat_completion([{"role": "user", "content": "test"}])

    # Case 2: empty content
    mock_resp.json.return_value = {
        "choices": [{"finish_reason": "stop", "message": {"content": "   "}}]
    }
    with pytest.raises(QbTruncatedOutput, match="empty content"):
        client.generate_chat_completion([{"role": "user", "content": "test"}])


def test_openai_client_4xx_fails_immediately(monkeypatch):
    from unittest.mock import MagicMock
    from qbank.llm import QbLLMError

    client = QbOpenAIClient(api_key="test_key", max_retries=3)

    mock_resp = MagicMock()
    mock_resp.status_code = 401
    mock_resp.text = "Unauthorized: Invalid API key"

    mock_http_client = MagicMock()
    mock_http_client.__enter__.return_value.post.return_value = mock_resp
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http_client)

    with pytest.raises(QbLLMError, match="HTTP 401"):
        client.generate_chat_completion([{"role": "user", "content": "test"}])

    # Should only call ONCE (no retry on 401)
    assert mock_http_client.__enter__.return_value.post.call_count == 1


def test_openai_client_quota_exhausted_fails_immediately(monkeypatch):
    from unittest.mock import MagicMock
    from qbank.llm import QbLLMQuotaError

    client = QbOpenAIClient(api_key="test_key", max_retries=3)

    mock_resp = MagicMock()
    mock_resp.status_code = 429
    mock_resp.headers = {}
    mock_resp.text = "You exceeded your current quota, please check your plan and billing details."


    mock_http_client = MagicMock()
    mock_http_client.__enter__.return_value.post.return_value = mock_resp
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http_client)

    with pytest.raises(QbLLMQuotaError, match="quota exhausted"):
        client.generate_chat_completion([{"role": "user", "content": "test"}])

    # Should fail immediately without retrying because of strong keyword 'billing'
    assert mock_http_client.__enter__.return_value.post.call_count == 1


def test_openai_client_429_generic_quota_retries_first(monkeypatch):
    from unittest.mock import MagicMock

    client = QbOpenAIClient(api_key="test_key", max_retries=2)

    resp_429 = MagicMock()
    resp_429.status_code = 429
    resp_429.headers = {}
    resp_429.text = "Rate limit exceeded. Please try again later."

    resp_200 = MagicMock()
    resp_200.status_code = 200
    resp_200.json.return_value = {
        "choices": [{"finish_reason": "stop", "message": {"content": "OK on retry"}}]
    }

    sleep_calls = []
    monkeypatch.setattr("time.sleep", lambda s: sleep_calls.append(s))

    mock_http_client = MagicMock()
    mock_http_client.__enter__.return_value.post.side_effect = [resp_429, resp_200]
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http_client)

    result = client.generate_chat_completion([{"role": "user", "content": "test"}])
    assert result == "OK on retry"
    assert len(sleep_calls) == 1
    assert mock_http_client.__enter__.return_value.post.call_count == 2



def test_openai_client_no_sleep_on_final_attempt(monkeypatch):
    from unittest.mock import MagicMock
    from qbank.llm import QbLLMError

    client = QbOpenAIClient(api_key="test_key", max_retries=2)

    mock_resp = MagicMock()
    mock_resp.status_code = 500
    mock_resp.text = "Internal Server Error"

    sleep_calls = []
    monkeypatch.setattr("time.sleep", lambda s: sleep_calls.append(s))

    mock_http_client = MagicMock()
    mock_http_client.__enter__.return_value.post.return_value = mock_resp
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http_client)

    with pytest.raises(QbLLMError, match="Server Error"):
        client.generate_chat_completion([{"role": "user", "content": "test"}])

    # max_retries = 2: attempt 1 sleeps, attempt 2 does NOT sleep!
    assert len(sleep_calls) == 1


def test_openai_client_429_short_retry_after_retries_and_succeeds(monkeypatch):
    from unittest.mock import MagicMock

    client = QbOpenAIClient(api_key="test_key", max_retries=3)

    # 1st call: 429 with Retry-After: 2
    resp_429 = MagicMock()
    resp_429.status_code = 429
    resp_429.headers = {"Retry-After": "2"}
    resp_429.text = "Rate limit reached, please wait"

    # 2nd call: 200 OK
    resp_200 = MagicMock()
    resp_200.status_code = 200
    resp_200.json.return_value = {
        "choices": [{"finish_reason": "stop", "message": {"content": "Success!"}}]
    }

    sleep_calls = []
    monkeypatch.setattr("time.sleep", lambda s: sleep_calls.append(s))

    mock_http_client = MagicMock()
    mock_http_client.__enter__.return_value.post.side_effect = [resp_429, resp_200]
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http_client)

    result = client.generate_chat_completion([{"role": "user", "content": "test"}])
    assert result == "Success!"
    assert sleep_calls == [2.0]
    assert mock_http_client.__enter__.return_value.post.call_count == 2


def test_openai_client_429_long_wait_raises_quota_error(monkeypatch):
    from unittest.mock import MagicMock
    from qbank.llm import QbLLMQuotaError

    client = QbOpenAIClient(api_key="test_key", max_retries=3)

    # 429 with Retry-After: 300 (> 60s max threshold)
    resp_429 = MagicMock()
    resp_429.status_code = 429
    resp_429.headers = {"Retry-After": "300"}
    resp_429.text = "Rate limit exceeded"

    mock_http_client = MagicMock()
    mock_http_client.__enter__.return_value.post.return_value = resp_429
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http_client)

    with pytest.raises(QbLLMQuotaError, match="exceeds max threshold"):
        client.generate_chat_completion([{"role": "user", "content": "test"}])

    # Fails immediately without retrying
    assert mock_http_client.__enter__.return_value.post.call_count == 1


def test_openai_client_retries_on_network_error(monkeypatch):
    import httpx
    from unittest.mock import MagicMock

    client = QbOpenAIClient(api_key="test_key", max_retries=3)

    resp_200 = MagicMock()
    resp_200.status_code = 200
    resp_200.json.return_value = {
        "choices": [{"finish_reason": "stop", "message": {"content": "Recovered from network drop!"}}]
    }

    sleep_calls = []
    monkeypatch.setattr("time.sleep", lambda s: sleep_calls.append(s))

    mock_http_client = MagicMock()
    # 1st attempt: Network ConnectError, 2nd attempt: Success
    mock_http_client.__enter__.return_value.post.side_effect = [
        httpx.ConnectError("Connection refused"),
        resp_200
    ]
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http_client)

    result = client.generate_chat_completion([{"role": "user", "content": "test"}])
    assert result == "Recovered from network drop!"
    assert len(sleep_calls) == 1
    assert mock_http_client.__enter__.return_value.post.call_count == 2


def test_openai_client_never_leaks_api_key(monkeypatch):
    from unittest.mock import MagicMock
    from qbank.llm import QbLLMError

    secret_key = "sk-super-secret-key-123456789"
    client = QbOpenAIClient(api_key=secret_key, max_retries=1)

    # Server returns error message echoing the raw api key
    mock_resp = MagicMock()
    mock_resp.status_code = 400
    mock_resp.text = f"Bad request with token {secret_key}"

    mock_http_client = MagicMock()
    mock_http_client.__enter__.return_value.post.return_value = mock_resp
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http_client)

    with pytest.raises(QbLLMError) as exc_info:
        client.generate_chat_completion([{"role": "user", "content": "test"}])

    err_str = str(exc_info.value)
    assert secret_key not in err_str
    assert "[REDACTED_API_KEY]" in err_str


def test_openai_client_fallback_on_503_high_demand(monkeypatch):
    from unittest.mock import MagicMock

    client = QbOpenAIClient(
        api_key="test_key",
        model="gemini-2.5-flash",
        fallback_models=["gemini-2.0-flash", "gemini-1.5-flash"],
        max_retries=2
    )

    resp_503 = MagicMock()
    resp_503.status_code = 503
    resp_503.text = "This model is currently experiencing high demand. Please try again later."

    resp_200 = MagicMock()
    resp_200.status_code = 200
    resp_200.json.return_value = {
        "choices": [{"finish_reason": "stop", "message": {"content": "Success from fallback model"}}]
    }

    mock_http_client = MagicMock()
    mock_http_client.__enter__.return_value.post.side_effect = [resp_503, resp_200]
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http_client)

    res = client.generate_chat_completion([{"role": "user", "content": "test"}])
    assert res == "Success from fallback model"
    assert client.active_model == "gemini-2.0-flash"


def test_openai_client_no_fallback_on_truncated_output(monkeypatch):
    """Rule 1: Truncation (finish_reason='length') must NOT fallback model."""
    from unittest.mock import MagicMock
    from qbank.llm import QbTruncatedOutput

    client = QbOpenAIClient(
        api_key="test_key",
        model="gemini-2.5-flash",
        fallback_models=["gemini-2.0-flash"],
        max_retries=1
    )

    resp_trunc = MagicMock()
    resp_trunc.status_code = 200
    resp_trunc.json.return_value = {
        "choices": [{"finish_reason": "length", "message": {"content": "Partial..."}}]
    }

    mock_http_client = MagicMock()
    mock_http_client.__enter__.return_value.post.return_value = resp_trunc
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http_client)

    with pytest.raises(QbTruncatedOutput, match="finish_reason='length'"):
        client.generate_chat_completion([{"role": "user", "content": "test"}])

    # Should only call ONCE for the primary model, never fall back to gemini-2.0-flash!
    assert mock_http_client.__enter__.return_value.post.call_count == 1
    assert client.active_model == "gemini-2.5-flash"


def test_openai_client_no_fallback_on_network_error(monkeypatch):
    """Rule 3: Network errors must NOT fallback model."""
    from unittest.mock import MagicMock
    from qbank.llm import QbLLMNetworkError

    client = QbOpenAIClient(
        api_key="test_key",
        model="gemini-2.5-flash",
        fallback_models=["gemini-2.0-flash"],
        max_retries=2
    )

    monkeypatch.setattr("time.sleep", lambda s: None)

    mock_http_client = MagicMock()
    mock_http_client.__enter__.return_value.post.side_effect = httpx.ConnectError("Connection failed")
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http_client)

    with pytest.raises(QbLLMNetworkError, match="Lỗi kết nối mạng"):
        client.generate_chat_completion([{"role": "user", "content": "test"}])

    # Should only retry on the primary model (2 times), never call fallback model
    assert mock_http_client.__enter__.return_value.post.call_count == 2
    assert client.active_model == "gemini-2.5-flash"


def test_openai_client_list_models(monkeypatch):
    """Rule 4: list_models calls GET /models and extracts IDs."""
    from unittest.mock import MagicMock

    client = QbOpenAIClient(api_key="test_key")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "data": [
            {"id": "gemini-2.5-flash"},
            {"id": "gemini-2.0-flash"},
            {"id": "gemini-1.5-flash"}
        ]
    }

    mock_http_client = MagicMock()
    mock_http_client.__enter__.return_value.get.return_value = mock_resp
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http_client)

    models = client.list_models()
    assert models == ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"]
    mock_http_client.__enter__.return_value.get.assert_called_once()


def test_openai_client_records_token_usage(monkeypatch):
    """Rule 2: usage metrics from response are parsed and recorded."""
    from unittest.mock import MagicMock

    client = QbOpenAIClient(api_key="test_key")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "choices": [{"finish_reason": "stop", "message": {"content": "OK"}}],
        "usage": {
            "prompt_tokens": 150,
            "completion_tokens": 300,
            "total_tokens": 450,
            "completion_tokens_details": {"reasoning_tokens": 120}
        }
    }

    mock_http_client = MagicMock()
    mock_http_client.__enter__.return_value.post.return_value = mock_resp
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http_client)

    client.generate_chat_completion([{"role": "user", "content": "test"}])
    assert client.last_usage.get("total_tokens") == 450
    assert client.last_usage.get("completion_tokens_details", {}).get("reasoning_tokens") == 120


def test_openai_client_fallback_on_404_model_not_found(monkeypatch):
    from unittest.mock import MagicMock

    client = QbOpenAIClient(
        api_key="test_key",
        model="gemini-deprecated-model",
        fallback_models=["gemini-2.5-flash"],
        max_retries=1
    )

    resp_404 = MagicMock()
    resp_404.status_code = 404
    resp_404.text = "Model not found"

    resp_200 = MagicMock()
    resp_200.status_code = 200
    resp_200.json.return_value = {
        "choices": [{"finish_reason": "stop", "message": {"content": "Found on fallback"}}]
    }

    mock_http_client = MagicMock()
    mock_http_client.__enter__.return_value.post.side_effect = [resp_404, resp_200]
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http_client)

    res = client.generate_chat_completion([{"role": "user", "content": "test"}])
    assert res == "Found on fallback"
    assert client.active_model == "gemini-2.5-flash"


def test_openai_client_all_fallbacks_fail_raises_error(monkeypatch):
    from unittest.mock import MagicMock
    from qbank.llm import QbLLMError

    client = QbOpenAIClient(
        api_key="test_key",
        model="m1",
        fallback_models=["m2"],
        max_retries=1
    )

    resp_503 = MagicMock()
    resp_503.status_code = 503
    resp_503.text = "Server overloaded"

    mock_http_client = MagicMock()
    mock_http_client.__enter__.return_value.post.return_value = resp_503
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http_client)

    with pytest.raises(QbLLMError, match="Failed to generate LLM completion after trying candidate models"):
        client.generate_chat_completion([{"role": "user", "content": "test"}])


def test_normalize_model_name():
    """Rule 1: normalize_model_name strips 'models/' prefix and whitespace."""
    from qbank.llm import normalize_model_name

    assert normalize_model_name("models/gemini-3.5-flash") == "gemini-3.5-flash"
    assert normalize_model_name("gemini-3.5-flash") == "gemini-3.5-flash"
    assert normalize_model_name("  models/gemini-2.0-flash  ") == "gemini-2.0-flash"
    assert normalize_model_name("") == ""
    assert normalize_model_name(None) == ""


def test_openai_client_probe_model_success(monkeypatch):
    """Rule 3: probe_model sends a single request and extracts latency, tokens, finish_reason."""
    from unittest.mock import MagicMock

    client = QbOpenAIClient(api_key="test_probe_key", model="gemini-3.5-flash")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "choices": [{"finish_reason": "stop", "message": {"content": "OK"}}],
        "usage": {
            "prompt_tokens": 15,
            "completion_tokens": 2,
            "total_tokens": 17,
            "completion_tokens_details": {"reasoning_tokens": 0}
        }
    }

    mock_http = MagicMock()
    mock_http.__enter__.return_value.post.return_value = mock_resp
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http)

    result = client.probe_model("gemini-3.5-flash", reasoning_effort="low")

    assert result["ok"] is True
    assert result["status_code"] == 200
    assert result["finish_reason"] == "stop"
    assert result["prompt_tokens"] == 15
    assert result["completion_tokens"] == 2
    assert result["reasoning_tokens"] == 0
    assert result["total_tokens"] == 17
    # Verify post was called exactly once (no retry, no fallback)
    assert mock_http.__enter__.return_value.post.call_count == 1
    # Verify reasoning_effort was in the payload
    _, kwargs = mock_http.__enter__.return_value.post.call_args
    assert kwargs["json"]["reasoning_effort"] == "low"
    assert kwargs["json"]["model"] == "gemini-3.5-flash"


def test_openai_client_probe_model_sanitizes_api_key_on_error(monkeypatch):
    """Rule 3: probe_model masks API key when reporting errors."""
    from unittest.mock import MagicMock

    secret_key = "secret_super_api_key_999"
    client = QbOpenAIClient(api_key=secret_key, model="gemini-3.5-flash")

    mock_resp = MagicMock()
    mock_resp.status_code = 400
    mock_resp.text = f"Invalid reasoning_effort for key {secret_key}"

    mock_http = MagicMock()
    mock_http.__enter__.return_value.post.return_value = mock_resp
    monkeypatch.setattr("httpx.Client", lambda **kwargs: mock_http)

    result = client.probe_model("gemini-3.5-flash", reasoning_effort="unsupported_effort")

    assert result["ok"] is False
    assert result["status_code"] == 400
    assert result["error_type"] == "400 Lỗi tham số (Bad Request)"
    assert secret_key not in result["error_message"]
    assert "[REDACTED_API_KEY]" in result["error_message"]



