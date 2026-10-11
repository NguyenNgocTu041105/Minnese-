import hashlib
import unicodedata
from typing import List, Optional, Literal, Dict
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict


class QbProvenance(BaseModel):
    model_config = ConfigDict(extra="forbid")
    origin: Literal["original_generated"] = "original_generated"
    batch_id: str
    prompt_version: str
    llm_model: str
    created_at: str


class QbQA(BaseModel):
    model_config = ConfigDict(extra="forbid")
    structure_ok: bool = True
    level_ok: bool = True
    out_of_level_words: List[str] = Field(default_factory=list)
    notes: List[str] = Field(default_factory=list)


class QbQuestion(BaseModel):
    """
    Core Question Model for QBank.
    NO fields storing third-party exam sources.
    Only original generated questions.
    """
    model_config = ConfigDict(extra="forbid")
    question_id: str
    level: int = Field(ge=1, le=6, description="HSK Level 1 to 6 supported in Phase 1")
    skill: Literal["listening", "reading", "writing", "speaking", "vocabulary", "grammar"]
    part_type: str
    stem: str
    passage: Optional[str] = None
    options: List[str]
    answer_index: int = Field(ge=0, le=3, description="0-based index of correct option")
    explanation_vi: str
    pinyin_stem: Optional[str] = None
    vocab_tags: List[str] = Field(default_factory=list)
    topic: str = ""
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    display_label: str = "Đề luyện tập theo chuẩn HSK 3.0"
    provenance: QbProvenance
    qa: QbQA
    status: Literal["pending", "approved", "needs_review", "rejected", "retired"] = "needs_review"
    report_count: int = 0
    times_answered: int = 0
    times_wrong: int = 0
    content_hash: str

    @field_validator("level")
    @classmethod
    def validate_level(cls, v: int) -> int:
        if v < 1 or v > 6:
            raise ValueError(f"Level {v} không được hỗ trợ trong giai đoạn này (chỉ hỗ trợ HSK 1 đến 6).")
        return v

    @field_validator("stem")
    @classmethod
    def normalize_stem(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Stem không được để trống.")
        return unicodedata.normalize("NFC", v.strip())

    @field_validator("options")
    @classmethod
    def validate_options(cls, v: List[str]) -> List[str]:
        if len(v) != 4:
            raise ValueError(f"Phải có đúng 4 phương án lựa chọn, nhận được {len(v)}.")
        normalized = [unicodedata.normalize("NFC", opt.strip()) for opt in v]
        if len(set(normalized)) != 4:
            raise ValueError("Các phương án lựa chọn không được trùng lặp nội dung.")
        return normalized

    @model_validator(mode="after")
    def verify_content_hash(self) -> "QbQuestion":
        computed = self.compute_hash(self.stem, self.options, self.answer_index)
        if self.content_hash != computed:
            raise ValueError(
                f"content_hash không khớp với compute_hash: kỳ vọng {computed}, nhận được {self.content_hash}"
            )
        return self

    @staticmethod
    def compute_hash(stem: str, options: List[str], answer_index: int) -> str:
        """Computes deterministic SHA-256 content hash on normalized NFC text."""
        norm_stem = unicodedata.normalize("NFC", stem.strip())
        norm_opts = "|".join([unicodedata.normalize("NFC", opt.strip()) for opt in options])
        raw = f"{norm_stem}##{norm_opts}##{answer_index}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class QbVocabItem(BaseModel):
    """Vocabulary record from syllabus."""
    word: str
    pinyin: str
    pos: str = ""
    level: int = Field(ge=1, le=6)
    topics: List[str] = Field(default_factory=list)
    source: str = "self-authored"
    license_status: Literal["self-authored", "official", "permitted", "unknown", "restricted"] = "self-authored"


class QbBlueprintPart(BaseModel):
    """Specification of a single part within a section."""
    type: str
    n_questions: int
    n_options: int = 4
    time_min: int = 5


class QbBlueprintSection(BaseModel):
    """Specification of a test section (e.g. reading)."""
    name: str
    parts: Dict[str, QbBlueprintPart]


class QbBlueprint(BaseModel):
    """Full exam blueprint for an HSK Level."""
    hsk_version: Literal["3.0"] = "3.0"
    level: int = Field(ge=1, le=6)
    verified: bool = False
    sections: Dict[str, QbBlueprintSection]


class QbSyncRecord(BaseModel):
    """Audit log of sync operations to legacy database."""
    sync_id: str
    batch_id: str
    question_id: str
    legacy_id: str
    synced_at: str
    legacy_source_url: str
    status: Literal["active", "retired"] = "active"
