import pytest
from pydantic import ValidationError
from qbank.models import QbQuestion, QbProvenance, QbQA


def test_valid_question_creation(sample_question):
    assert sample_question.level == 1
    assert len(sample_question.options) == 4
    assert sample_question.answer_index == 0
    assert sample_question.status == "needs_review"


def test_level_validation_rejects_out_of_range(sample_question):
    # Reject level 0
    data = sample_question.model_dump()
    data["level"] = 0
    with pytest.raises(ValidationError):
        QbQuestion.model_validate(data)

    # Reject level 7 (Phase 1 only supports 1-6)
    data["level"] = 7
    with pytest.raises(ValidationError):
        QbQuestion.model_validate(data)


def test_options_validation_rejects_less_than_four(sample_question):
    data = sample_question.model_dump()
    data["options"] = ["A", "B", "C"]
    with pytest.raises(ValidationError):
        QbQuestion.model_validate(data)


def test_options_validation_rejects_duplicates(sample_question):
    data = sample_question.model_dump()
    data["options"] = ["学校", "老师", "学校", "准备"]
    with pytest.raises(ValidationError):
        QbQuestion.model_validate(data)


def test_content_hash_determinism():
    stem = "今天天气很好。"
    opts = ["A", "B", "C", "D"]
    h1 = QbQuestion.compute_hash(stem, opts, 0)
    h2 = QbQuestion.compute_hash(stem, opts, 0)
    h3 = QbQuestion.compute_hash(stem, opts, 1)

    assert h1 == h2
    assert h1 != h3


def test_content_hash_mismatch_rejected(sample_question):
    # Alter content_hash to a bogus value
    data = sample_question.model_dump()
    data["content_hash"] = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

    with pytest.raises(ValidationError, match="content_hash không khớp với compute_hash"):
        QbQuestion.model_validate(data)

