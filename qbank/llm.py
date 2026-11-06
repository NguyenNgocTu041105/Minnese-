import re
import json
import time
import random
import logging
from typing import Dict, Any, Optional, List
import httpx
from qbank.config import qbank_config, assert_free_only_provider

logger = logging.getLogger("qbank.llm")


def sanitize_error(text: str, api_key: Optional[str]) -> str:
    """Ensures API key never leaks in logs or exceptions."""
    if api_key and api_key in text:
        return text.replace(api_key, "[REDACTED_API_KEY]")
    return text


def normalize_model_name(name: Optional[str]) -> str:
    """Strips leading 'models/' prefix and whitespace for consistent model matching."""
    if not name:
        return ""
    n = name.strip()
    if n.startswith("models/"):
        n = n[len("models/"):]
    return n


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



class QbLLMNetworkError(QbLLMError):
    """Raised when network connection fails (DNS resolution, connect timeout, etc.)."""
    pass


class QbLLMInterface:
    """Base interface for QBank LLM clients."""
    active_model: str = ""
    last_usage: Dict[str, Any] = {}

    def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        response_format: Optional[Dict[str, str]] = None
    ) -> str:
        raise NotImplementedError

    def probe_model(
        self,
        model_name: str,
        reasoning_effort: Optional[str] = None
    ) -> Dict[str, Any]:
        raise NotImplementedError


class QbOpenAIClient(QbLLMInterface):
    """
    OpenAI-compatible HTTP Client using httpx.
    Strictly reads only QBANK_LLM_API_KEY.
    Configured with timeout and exponential backoff retry for 429/5xx and network errors.
    Supports automatic multi-model failover (fallback_models) ONLY for:
      - 503 Server Error (quá tải / high demand sau khi hết retry)
      - 404 Model không tồn tại hoặc đã đổi tên
      - 429 Hết quota theo ngày / billing của model đó
    Tuyệt đối KHÔNG fallback khi:
      - Bị cắt cụt token (finish_reason='length') -> Raise QbTruncatedOutput để caller chia đôi lô
      - Lỗi mạng / DNS (httpx.RequestError) -> Raise QbLLMNetworkError để xử lý mạng
      - Lỗi xác thực 401 / 403 -> Raise QbLLMError
    Never exposes API key in exceptions or logs.
    """
    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        fallback_models: Optional[List[str]] = None,
        reasoning_effort: Optional[str] = None,
        max_retries: int = 3,
        timeout: float = 45.0
    ):
        self.base_url = (base_url or qbank_config.llm_base_url).rstrip("/")
        self.api_key = api_key or qbank_config.llm_api_key
        self.model = model or qbank_config.llm_model
        if fallback_models is not None:
            self.fallback_models = fallback_models
        else:
            self.fallback_models = qbank_config.fallback_models
        self.reasoning_effort = reasoning_effort if reasoning_effort is not None else qbank_config.llm_reasoning_effort
        self.active_model = self.model
        self.max_retries = max_retries
        self.timeout = timeout
        self.network_retry_delays = [5.0, 15.0, 45.0]
        self.last_usage: Dict[str, Any] = {}

        if not self.api_key:
            logger.warning("QBANK_LLM_API_KEY is not set. Real LLM calls will fail unless configured.")

    def list_models(self) -> List[str]:
        """
        Retrieves the list of available model IDs from the OpenAI-compatible endpoint.
        Never prints or logs the API key.
        """
        assert_free_only_provider(self.base_url)
        if not self.api_key:
            raise ValueError("QBANK_LLM_API_KEY is missing. Cannot fetch model list.")

        endpoint = f"{self.base_url}/models"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.get(endpoint, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                raw_list = data.get("data", [])
                model_ids = []
                for item in raw_list:
                    if isinstance(item, dict) and "id" in item:
                        model_ids.append(item["id"])
                    elif isinstance(item, str):
                        model_ids.append(item)
                return sorted(model_ids)
            elif resp.status_code in (401, 403):
                raise QbLLMError(f"Xác thực thất bại khi gọi /models (HTTP {resp.status_code}). Vui lòng kiểm tra QBANK_LLM_API_KEY.")
            else:
                err_text = sanitize_error(resp.text[:200], self.api_key)
                raise QbLLMError(f"Không thể lấy danh sách model (HTTP {resp.status_code}): {err_text}")
        except httpx.RequestError as e:
            raise QbLLMNetworkError(f"Lỗi mạng khi kết nối đến {endpoint}: {e}")

    def probe_model(
        self,
        model_name: str,
        reasoning_effort: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sends a single minimal chat completion request to test connectivity,
        latency, finish_reason, token usage, and parameters for a specific model.
        Does NOT retry and does NOT fallback to other models.
        """
        assert_free_only_provider(self.base_url)
        if not self.api_key:
            raise ValueError("QBANK_LLM_API_KEY is missing. Cannot probe model.")

        endpoint = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload: Dict[str, Any] = {
            "model": model_name,
            "messages": [{"role": "user", "content": "Ping. Reply with 'OK'."}],
            "max_tokens": 32,
            "temperature": 0.0
        }
        if reasoning_effort is not None and reasoning_effort != "":
            payload["reasoning_effort"] = reasoning_effort

        start_time = time.perf_counter()
        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(endpoint, headers=headers, json=payload)
            latency_ms = (time.perf_counter() - start_time) * 1000

            result: Dict[str, Any] = {
                "model": model_name,
                "reasoning_effort": reasoning_effort,
                "status_code": resp.status_code,
                "latency_ms": latency_ms,
                "ok": resp.status_code == 200
            }

            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                result["finish_reason"] = choices[0].get("finish_reason") if choices else None
                result["content"] = choices[0]["message"].get("content", "") if choices and "message" in choices[0] else ""
                usage = data.get("usage", {})
                result["prompt_tokens"] = usage.get("prompt_tokens")
                result["completion_tokens"] = usage.get("completion_tokens")
                result["total_tokens"] = usage.get("total_tokens")
                details = usage.get("completion_tokens_details") or {}
                result["reasoning_tokens"] = details.get("reasoning_tokens")
            else:
                raw_text = sanitize_error(resp.text[:500], self.api_key)
                result["error_message"] = raw_text
                if resp.status_code == 400:
                    result["error_type"] = "400 Lỗi tham số (Bad Request)"
                elif resp.status_code in (401, 403):
                    result["error_type"] = f"{resp.status_code} Lỗi xác thực / quyền hạn (Auth Error)"
                elif resp.status_code == 404:
                    result["error_type"] = "404 Model không tồn tại hoặc sai tên (Not Found)"
                elif resp.status_code == 429:
                    result["error_type"] = "429 Hết quota hoặc bị giới hạn tần suất (Rate Limit / Quota)"
                elif resp.status_code == 503:
                    result["error_type"] = "503 Server quá tải (Service Unavailable)"
                else:
                    result["error_type"] = f"{resp.status_code} Lỗi phản hồi từ server"

            return result
        except httpx.RequestError as e:
            latency_ms = (time.perf_counter() - start_time) * 1000
            return {
                "model": model_name,
                "reasoning_effort": reasoning_effort,
                "status_code": None,
                "latency_ms": latency_ms,
                "ok": False,
                "error_type": "Lỗi kết nối mạng (Network Error)",
                "error_message": sanitize_error(str(e), self.api_key)
            }

    def generate_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        response_format: Optional[Dict[str, str]] = None
    ) -> str:
        assert_free_only_provider(self.base_url)
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
        effective_max_tokens = max_tokens if max_tokens is not None else qbank_config.llm_max_tokens

        # Candidate models to try in order: active_model first, then fallbacks
        candidate_models = [self.active_model]
        for m in self.fallback_models:
            if m and m not in candidate_models:
                candidate_models.append(m)

        last_error = None

        for model_idx, current_model in enumerate(candidate_models):
            has_next_model = (model_idx + 1 < len(candidate_models))
            next_model = candidate_models[model_idx + 1] if has_next_model else None

            payload: Dict[str, Any] = {
                "model": current_model,
                "messages": messages,
                "temperature": temperature if temperature is not None else qbank_config.llm_temperature,
                "max_tokens": effective_max_tokens
            }
            if self.reasoning_effort:
                payload["reasoning_effort"] = self.reasoning_effort
            if response_format:
                payload["response_format"] = response_format

            model_failed_for_fallback = False

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

                        # Record and log actual token usage from API
                        usage = data.get("usage", {})
                        self.last_usage = usage
                        if usage:
                            p_tok = usage.get("prompt_tokens", 0)
                            c_tok = usage.get("completion_tokens", 0)
                            t_tok = usage.get("total_tokens", 0)
                            details = usage.get("completion_tokens_details") or {}
                            r_tok = details.get("reasoning_tokens")
                            r_str = f", reasoning={r_tok}" if r_tok is not None else ""
                            logger.info(f"API Token Usage ({current_model}): prompt={p_tok}, completion={c_tok}{r_str}, total={t_tok}")

                        if finish_reason == "length":
                            # Rule 1: DO NOT fallback model on length truncation. Caller must split the batch.
                            raise QbTruncatedOutput(
                                "LLM output was truncated due to max_tokens limit (finish_reason='length')."
                            )

                        if not content or not content.strip():
                            raise QbTruncatedOutput("LLM returned empty content.")

                        # Success! Record active model if switched
                        if current_model != self.active_model:
                            logger.info(f"Đã chuyển đổi active model thành công sang: {current_model}")
                            self.active_model = current_model

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
                                        f"Rate limited (429) trên model '{current_model}'. Server yêu cầu chờ {retry_delay:.2f}s "
                                        f"(Lần thử {attempt}/{self.max_retries})..."
                                    )
                                    time.sleep(retry_delay)
                                    continue
                                elif has_next_model:
                                    logger.warning(
                                        f"Model '{current_model}' chạm rate limit sau {self.max_retries} lần thử. "
                                        f"Tự động fallback sang model: '{next_model}'..."
                                    )
                                    model_failed_for_fallback = True
                                    break
                                else:
                                    break
                            else:
                                # Required wait exceeds max configured threshold -> per-model daily quota exhausted
                                err = QbLLMQuotaError(
                                    f"LLM wait time ({retry_delay}s) exceeds max threshold ({max_delay}s): "
                                    f"{sanitize_error(response.text[:200], self.api_key)}"
                                )
                                if has_next_model:
                                    logger.warning(
                                        f"Model '{current_model}' hết quota ngày (yêu cầu chờ {retry_delay}s). "
                                        f"Tự động fallback sang model: '{next_model}'..."
                                    )
                                    model_failed_for_fallback = True
                                    last_error = err
                                    break
                                else:
                                    raise err
                        else:
                            # No suggested retry delay
                            resp_lower = response.text.lower()
                            strong_quota_terms = ("billing", "zero balance")
                            if any(term in resp_lower for term in strong_quota_terms):
                                # Fatal account-level billing error -> DO NOT fallback, fail immediately
                                raise QbLLMQuotaError(
                                    f"LLM quota exhausted (HTTP 429 strong quota keywords): "
                                    f"{sanitize_error(response.text[:200], self.api_key)}"
                                )

                            # Generic 429 (per-model rate limit or daily limit)
                            if attempt < self.max_retries:
                                sleep_sec = min((2 ** attempt) + random.uniform(0.5, 1.5), max_delay)
                                logger.warning(
                                    f"Rate limited (429) trên model '{current_model}'. Thử lại sau {sleep_sec:.2f}s "
                                    f"(Lần thử {attempt}/{self.max_retries})..."
                                )
                                time.sleep(sleep_sec)
                                continue
                            elif has_next_model:
                                logger.warning(
                                    f"Model '{current_model}' hết quota (429) sau {self.max_retries} lần thử. "
                                    f"Tự động fallback sang model: '{next_model}'..."
                                )
                                model_failed_for_fallback = True
                                last_error = QbLLMQuotaError(
                                    f"HTTP 429 repeated after {self.max_retries} attempts: "
                                    f"{sanitize_error(response.text[:200], self.api_key)}"
                                )
                                break
                            else:
                                raise QbLLMQuotaError(
                                    f"HTTP 429 repeated after {self.max_retries} attempts: "
                                    f"{sanitize_error(response.text[:200], self.api_key)}"
                                )

                    # Server errors (5xx)
                    if response.status_code in (500, 502, 503, 504):
                        err_text = sanitize_error(response.text[:200], self.api_key)
                        last_error = QbLLMError(f"HTTP {response.status_code} Server Error: {err_text}")

                        # Check 503 high demand (overload on specific model)
                        if response.status_code == 503 and has_next_model:
                            logger.warning(
                                f"Model '{current_model}' báo HTTP 503 (quá tải / high demand). "
                                f"Tự động fallback ngay sang model: '{next_model}'..."
                            )
                            model_failed_for_fallback = True
                            break

                        if attempt < self.max_retries:
                            sleep_sec = (2 ** attempt) + random.uniform(0.5, 1.5)
                            logger.warning(
                                f"Lỗi server ({response.status_code}) trên model '{current_model}'. Thử lại sau {sleep_sec:.2f}s "
                                f"(Lần thử {attempt}/{self.max_retries})..."
                            )
                            time.sleep(sleep_sec)
                            continue
                        elif has_next_model:
                            logger.warning(
                                f"Model '{current_model}' liên tục lỗi 5xx sau {self.max_retries} lần thử. "
                                f"Tự động fallback sang model: '{next_model}'..."
                            )
                            model_failed_for_fallback = True
                            break

                    # 404: Model not found or changed name
                    if response.status_code == 404:
                        err_text = sanitize_error(response.text[:200], self.api_key)
                        last_error = QbLLMError(f"LLM model not found (HTTP 404): {err_text}")
                        if has_next_model:
                            logger.warning(
                                f"Model '{current_model}' không tồn tại hoặc đã đổi tên (HTTP 404). "
                                f"Tự động fallback sang model: '{next_model}'..."
                            )
                            model_failed_for_fallback = True
                            break
                        else:
                            raise last_error

                    # Other 4xx client errors (400, 401, 403) -> Fail immediately, NO fallback, NO retry!
                    if 400 <= response.status_code < 499:
                        raise QbLLMError(
                            f"LLM client error (HTTP {response.status_code}): {sanitize_error(response.text[:200], self.api_key)}"
                        )

                    response.raise_for_status()

                except (QbLLMQuotaError, QbTruncatedOutput, QbLLMError):
                    raise
                except (httpx.RequestError, httpx.HTTPStatusError) as e:
                    last_error = e
                    if attempt < self.max_retries:
                        delay_idx = min(attempt - 1, len(self.network_retry_delays) - 1)
                        sleep_sec = self.network_retry_delays[delay_idx]
                        logger.warning(f"Lỗi mạng khi gọi model '{current_model}': {type(e).__name__}. Thử lại sau {sleep_sec:.2f}s (Lần thử {attempt}/{self.max_retries})...")
                        time.sleep(sleep_sec)
                    else:
                        # Rule 3: DO NOT fallback model on network/DNS errors!
                        raise QbLLMNetworkError(
                            f"Lỗi kết nối mạng khi gọi model '{current_model}' sau {self.max_retries} lần thử: {e}"
                        )

            if model_failed_for_fallback:
                continue

        if isinstance(last_error, (QbLLMQuotaError, QbTruncatedOutput)):
            raise last_error
        raise QbLLMError(f"Failed to generate LLM completion after trying candidate models ({candidate_models}). Last error: {last_error}")



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
        self.last_usage = {
            "prompt_tokens": 120,
            "completion_tokens": 80,
            "total_tokens": 200,
            "completion_tokens_details": {"reasoning_tokens": 0}
        }
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

    def probe_model(
        self,
        model_name: str,
        reasoning_effort: Optional[str] = None
    ) -> Dict[str, Any]:
        self.calls_count += 1
        return {
            "model": model_name,
            "reasoning_effort": reasoning_effort,
            "status_code": 200,
            "latency_ms": 115.0,
            "ok": True,
            "finish_reason": "stop",
            "content": "OK",
            "prompt_tokens": 10,
            "completion_tokens": 2,
            "reasoning_tokens": 0,
            "total_tokens": 12
        }
