import os
from typing import Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator


# Load environment variables from .env
load_dotenv()


PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


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
    llm_temperature: float = Field(
        default_factory=lambda: float(os.getenv("QBANK_LLM_TEMPERATURE", "0.7"))
    )

    # Runtime Limits
    max_calls_per_run: int = Field(
        default_factory=lambda: int(os.getenv("QBANK_MAX_CALLS_PER_RUN", "10"))
    )
    batch_size: int = Field(
        default_factory=lambda: int(os.getenv("QBANK_BATCH_SIZE", "10"))
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



# Singleton config instance
qbank_config = QbConfig()
