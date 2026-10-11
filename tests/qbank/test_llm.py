import json
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


