import os
from typing import Optional
from urllib.parse import urlsplit
try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    def load_dotenv(*args, **kwargs):
        return False
from pydantic import BaseModel, Field, field_validator


# Load environment variables from .env
load_dotenv()


PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def assert_free_only_provider(base_url: str) -> None:
    """Fail closed for the Python generator under the free-only policy."""
    free_only = os.getenv("QBANK_LLM_FREE_ONLY", "true").strip().lower()
    allow_paid = os.getenv("QBANK_LLM_ALLOW_PAID", "false").strip().lower()
    if free_only == "false" and allow_paid == "true":
        return
    if free_only != "true" or allow_paid != "false":
        raise RuntimeError(
            "QBank generation blocked: QBANK_LLM_FREE_ONLY=true and "
            "QBANK_LLM_ALLOW_PAID=false are required."
        )

    try:
        parsed = urlsplit(base_url)
        scheme = parsed.scheme.lower()
        hostname = (parsed.hostname or "").lower()
    except ValueError:
        scheme = ""
        hostname = ""

    if scheme != "https" or hostname != "api.groq.com":
        raise RuntimeError(
            "QBank generation blocked: only the verified free Groq HTTPS endpoint is allowed "
            "while free-only policy is active."
        )


def resolve_project_path(path: str) -> str:
    """Resolves relative path to absolute path anchored at project root."""
    if not path:
        return path
    if os.path.isabs(path):
        return os.path.abspath(path)
    return os.path.abspath(os.path.join(PROJECT_ROOT, path))


class QbConfig(BaseModel):
    """
    QBank Configuration.
    STRICT RULE: Only reads QBANK_LLM_API_KEY.
    Never fallbacks to GEMINI_API_KEY or OPENAI_API_KEY.
    """
    # LLM Settings (OpenAI-compatible)
    llm_base_url: str = Field(
        default_factory=lambda: os.getenv(
            "QBANK_LLM_BASE_URL",
            "https://generativelanguage.googleapis.com/v1beta/openai/"
        )
    )
    llm_api_key: Optional[str] = Field(
        default_factory=lambda: os.getenv("QBANK_LLM_API_KEY")
    )
    llm_model: str = Field(
        default_factory=lambda: os.getenv("QBANK_LLM_MODEL", "gemini-2.5-flash")
    )
    llm_fallback_models: str = Field(
        default_factory=lambda: os.getenv("QBANK_LLM_FALLBACK_MODELS", "")
    )
    llm_reasoning_effort: str = Field(
        default_factory=lambda: os.getenv("QBANK_LLM_REASONING_EFFORT", "low")
    )
    llm_temperature: float = Field(
        default_factory=lambda: float(os.getenv("QBANK_LLM_TEMPERATURE", "0.7"))
    )
    llm_max_tokens: int = Field(
        default_factory=lambda: int(os.getenv("QBANK_LLM_MAX_TOKENS", "8192"))
    )

    @property
    def fallback_models(self) -> list:
        if not self.llm_fallback_models:
            return []
        return [m.strip() for m in self.llm_fallback_models.split(",") if m.strip()]

    # Runtime Limits
    max_calls_per_run: int = Field(
        default_factory=lambda: int(os.getenv("QBANK_MAX_CALLS_PER_RUN", "10"))
    )
    max_failures_per_run: int = Field(
        default_factory=lambda: int(os.getenv("QBANK_MAX_FAILURES_PER_RUN", "6"))
    )
    batch_size: int = Field(
        default_factory=lambda: int(os.getenv("QBANK_BATCH_SIZE", "5"))
    )

    # Local Storage Settings
    db_path: str = Field(
        default_factory=lambda: resolve_project_path(
            os.getenv("QBANK_DB_PATH", os.path.join("data", "qbank", "qbank.db"))
        )
    )

    @field_validator("db_path")
    @classmethod
    def ensure_absolute_db_path(cls, v: str) -> str:
        return resolve_project_path(v)


    # Review & Auto-Approve Flags
    auto_approve: bool = Field(
        default_factory=lambda: os.getenv("QBANK_AUTO_APPROVE", "false").lower() in ("true", "1", "yes")
    )
    report_threshold_to_review: int = Field(
        default_factory=lambda: int(os.getenv("QBANK_REPORT_THRESHOLD", "3"))
    )
    out_of_level_threshold: float = Field(
        default_factory=lambda: float(os.getenv("QBANK_OUT_OF_LEVEL_THRESHOLD", "0.15"))
    )
    char_budget: float = Field(
        default_factory=lambda: float(os.getenv("QBANK_CHAR_BUDGET", "0.05"))
    )
    near_dup_threshold: float = Field(
        default_factory=lambda: float(os.getenv("QBANK_NEAR_DUP_THRESHOLD", "0.80"))
    )
    max_retry_delay_sec: float = Field(
        default_factory=lambda: float(os.getenv("QBANK_MAX_RETRY_DELAY_SEC", "60.0"))
    )

    # Stem and Option Length Thresholds by Level Group (HSK 1-2, HSK 3-4, HSK 5-6)
    stem_len_hsk12: str = Field(
        default_factory=lambda: os.getenv("QBANK_STEM_LEN_HSK12", "6,35")
    )
    stem_len_hsk34: str = Field(
        default_factory=lambda: os.getenv("QBANK_STEM_LEN_HSK34", "8,60")
    )
    stem_len_hsk56: str = Field(
        default_factory=lambda: os.getenv("QBANK_STEM_LEN_HSK56", "10,100")
    )
    option_max_len_hsk12: int = Field(
        default_factory=lambda: int(os.getenv("QBANK_OPTION_MAX_LEN_HSK12", "6"))
    )
    option_max_len_hsk36: int = Field(
        default_factory=lambda: int(os.getenv("QBANK_OPTION_MAX_LEN_HSK36", "10"))
    )
    option_max_len_diff: int = Field(
        default_factory=lambda: int(os.getenv("QBANK_OPTION_MAX_LEN_DIFF", "3"))
    )
    sampling_seed: Optional[int] = Field(
        default_factory=lambda: int(os.getenv("QBANK_SAMPLING_SEED")) if os.getenv("QBANK_SAMPLING_SEED") else None
    )



# Singleton config instance
qbank_config = QbConfig()
