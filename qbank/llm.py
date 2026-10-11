import re
import json
import time
import random
import logging
from typing import Dict, Any, Optional, List
import httpx
from qbank.config import qbank_config

logger = logging.getLogger("qbank.llm")


def sanitize_error(text: str, api_key: Optional[str]) -> str:
    """Ensures API key never leaks in logs or exceptions."""
    if api_key and api_key in text:
        return text.replace(api_key, "[REDACTED_API_KEY]")
    return text


def extract_retry_delay(response: httpx.Response) -> Optional[float]:
    """Extracts suggested retry delay in seconds from headers or body."""
    # 1. Header Retry-After
    hdr = response.headers.get("Retry-After")
    if hdr:
        try:
            return float(hdr)
        except ValueError:
            pass

    # 2. JSON / body retryDelay (e.g., Google RPC / OpenAI format)
    try:
        match = re.search(r'retryDelay["\']?\s*:\s*["\']?(\d+(?:\.\d+)?)s?["\']?', response.text, re.IGNORECASE)
        if match:
            return float(match.group(1))
    except Exception:
        pass

    return None


class QbLLMError(Exception):
    """Base exception for QBank LLM errors."""
    pass


class QbLLMQuotaError(QbLLMError):
    """Raised when LLM quota is exhausted (429 with quota message or zero balance)."""
    pass


class QbTruncatedOutput(QbLLMError):
    """Raised when LLM output is truncated (finish_reason == 'length' or empty content)."""
    pass



class QbLLMInterface:
    """Base interface for QBank LLM clients."""
    def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: int = 2048,
        response_format: Optional[Dict[str, str]] = None
    ) -> str:
        raise NotImplementedError


class QbOpenAIClient(QbLLMInterface):
    """
    OpenAI-compatible HTTP Client using httpx.
    Strictly reads only QBANK_LLM_API_KEY.
    Configured with timeout and exponential backoff retry for 429/5xx and network errors.
    Fails immediately on 4xx client errors (400, 401, 403, 404).
    Never exposes API key in exceptions or logs.
    """
    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        max_retries: int = 3,
        timeout: float = 45.0
    ):
        self.base_url = (base_url or qbank_config.llm_base_url).rstrip("/")
        self.api_key = api_key or qbank_config.llm_api_key
        self.model = model or qbank_config.llm_model
        self.max_retries = max_retries
        self.timeout = timeout

        if not self.api_key:
            logger.warning("QBANK_LLM_API_KEY is not set. Real LLM calls will fail unless configured.")

    def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: int = 2048,
        response_format: Optional[Dict[str, str]] = None
    ) -> str:
        if not self.api_key:
            raise ValueError(
                "QBANK_LLM_API_KEY is missing. Please set QBANK_LLM_API_KEY in your .env file. "
                "Do not use GEMINI_API_KEY or OPENAI_API_KEY."
            )

        endpoint = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature if temperature is not None else qbank_config.llm_temperature,
            "max_tokens": max_tokens
        }

        if response_format:
            payload["response_format"] = response_format

        last_error = None
        for attempt in range(1, self.max_retries + 1):
            try:
                with httpx.Client(timeout=self.timeout) as client:
                    response = client.post(endpoint, headers=headers, json=payload)

                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if not choices or "message" not in choices[0]:
                        raise ValueError("Malformed response format from LLM: missing choices/message")

                    choice = choices[0]
                    finish_reason = choice.get("finish_reason")
                    content = choice["message"].get("content", "")

                    if finish_reason == "length":
                        raise QbTruncatedOutput(
                            "LLM output was truncated due to max_tokens limit (finish_reason='length')."
                        )
                    if not content or not content.strip():
                        raise QbTruncatedOutput("LLM returned empty content.")

                    return content

                # Check 429: Rate limit or Quota exhaustion
                if response.status_code == 429:
                    retry_delay = extract_retry_delay(response)
                    max_delay = qbank_config.max_retry_delay_sec

                    if retry_delay is not None:
                        if retry_delay <= max_delay:
                            last_error = QbLLMError(
                                f"HTTP 429 Rate Limited (suggested wait: {retry_delay}s): "
                                f"{sanitize_error(response.text[:200], self.api_key)}"
                            )
                            if attempt < self.max_retries:
                                logger.warning(
                                    f"Rate limited (429). Server requested wait of {retry_delay:.2f}s "
                                    f"(Attempt {attempt}/{self.max_retries})..."
                                )
                                time.sleep(retry_delay)
                                continue
                            break
                        else:
                            # Required wait exceeds max configured threshold (e.g. daily quota reset)
                            raise QbLLMQuotaError(
                                f"LLM wait time ({retry_delay}s) exceeds max threshold ({max_delay}s): "
                                f"{sanitize_error(response.text[:200], self.api_key)}"
                            )
                    else:
                        # No suggested retry delay from server
                        resp_lower = response.text.lower()
                        strong_quota_terms = ("billing", "daily", "insufficient", "zero balance")
                        if any(term in resp_lower for term in strong_quota_terms):
                            raise QbLLMQuotaError(
                                f"LLM quota exhausted (HTTP 429 strong quota keywords): "
                                f"{sanitize_error(response.text[:200], self.api_key)}"
                            )

                        # Generic 429 (even if mentioning 'quota' or 'exceeded'): retry 1-2 times with backoff first!
                        if attempt < self.max_retries:
                            sleep_sec = min((2 ** attempt) + random.uniform(0.5, 1.5), max_delay)
                            logger.warning(
                                f"Rate limited (429). Retrying with backoff in {sleep_sec:.2f}s "
                                f"(Attempt {attempt}/{self.max_retries})..."
                            )
                            time.sleep(sleep_sec)
                            continue
                        else:
                            # Still 429 after retries -> raise QbLLMQuotaError
                            raise QbLLMQuotaError(
                                f"HTTP 429 repeated after {self.max_retries} attempts: "
                                f"{sanitize_error(response.text[:200], self.api_key)}"
                            )


                # Server errors (5xx) -> backoff retry
                if response.status_code in (500, 502, 503, 504):
                    last_error = QbLLMError(
                        f"HTTP {response.status_code} Server Error: {sanitize_error(response.text[:200], self.api_key)}"
                    )
                    if attempt < self.max_retries:
                        sleep_sec = (2 ** attempt) + random.uniform(0.5, 1.5)
                        logger.warning(
                            f"Server error ({response.status_code}). Retrying in {sleep_sec:.2f}s "
                            f"(Attempt {attempt}/{self.max_retries})..."
                        )
                        time.sleep(sleep_sec)
                    continue

                # Other 4xx client errors (400, 401, 403, 404, etc.) -> Fail immediately, NO retry!
                if 400 <= response.status_code < 499:
                    raise QbLLMError(
                        f"LLM client error (HTTP {response.status_code}): {sanitize_error(response.text[:200], self.api_key)}"
                    )


                response.raise_for_status()

            except (QbLLMQuotaError, QbTruncatedOutput, QbLLMError):
                # Do not retry fatal client errors, quota errors, or truncation
                raise
            except (httpx.RequestError, httpx.HTTPStatusError) as e:
                # Network connectivity error (timeout, connect error) -> retry
                last_error = e
                if attempt < self.max_retries:
                    sleep_sec = (2 ** attempt) + random.uniform(0.5, 1.5)
                    logger.warning(f"Network error calling LLM: {type(e).__name__}. Retrying in {sleep_sec:.2f}s...")
                    time.sleep(sleep_sec)

        raise QbLLMError(f"Failed to generate LLM completion after {self.max_retries} attempts. Last error: {last_error}")



class QbMockLLM(QbLLMInterface):
    """
    Deterministic Mock LLM for offline unit testing without real network calls.
    Returns structurally valid JSON question batches according to the prompt level.
    """
    def __init__(self, predefined_response: Optional[str] = None):
        self.predefined_response = predefined_response
        self.calls_count = 0

    def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: int = 2048,
        response_format: Optional[Dict[str, str]] = None
    ) -> str:
        self.calls_count += 1
        if self.predefined_response:
            return self.predefined_response

        # Default deterministic mock JSON output for 2 sample questions
        mock_data = {
            "questions": [
                {
                    "stem": "今天天气很好，我们一起去学校借书吧。",
                    "options": ["学校", "老师", "朋友", "准备"],
                    "answer_index": 0,
                    "explanation_vi": "Câu nói về việc đi đến một địa điểm để mượn sách. '学校' (trường học) là phương án chính xác nhất.",
                    "topic": "education",
                    "vocab_tags": ["学校", "借书"]
                },
                {
                    "stem": "王老师正在给学生们讲课。",
                    "options": ["老师", "朋友", "图书", "运动"],
                    "answer_index": 0,
                    "explanation_vi": "Trong ngữ cảnh giảng bài cho học sinh thì chủ ngữ thích hợp là '老师' (giáo viên).",
                    "topic": "education",
                    "vocab_tags": ["老师", "学生"]
                }
            ]
        }
        return json.dumps(mock_data, ensure_ascii=False)
