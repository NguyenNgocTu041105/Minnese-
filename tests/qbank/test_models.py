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
    # Reject < 2 options (1 option)
    data = sample_question.model_dump()
    data["options"] = ["A"]
    with pytest.raises(ValidationError):
        QbQuestion.model_validate(data)

    # Reject > 8 options (9 options)
    data["options"] = ["A", "B", "C", "D", "E", "F", "G", "H", "I"]
    with pytest.raises(ValidationError):
        QbQuestion.model_validate(data)


def test_options_validation_accepts_two_to_eight(sample_question):
    data = sample_question.model_dump()

    # 2 options (True/False)
    data["options"] = ["对", "错"]
    data["answer_index"] = 1
    data["content_hash"] = QbQuestion.compute_hash(data["stem"], data["options"], data["answer_index"])
    q2 = QbQuestion.model_validate(data)
    assert len(q2.options) == 2
    assert q2.answer_index == 1

    # 5 options (Matching)
    data["options"] = ["A", "B", "C", "D", "E"]
    data["answer_index"] = 4
    data["content_hash"] = QbQuestion.compute_hash(data["stem"], data["options"], data["answer_index"])
    q5 = QbQuestion.model_validate(data)
    assert len(q5.options) == 5
    assert q5.answer_index == 4

    # 8 options
    data["options"] = ["A", "B", "C", "D", "E", "F", "G", "H"]
    data["answer_index"] = 7
    data["content_hash"] = QbQuestion.compute_hash(data["stem"], data["options"], data["answer_index"])
    q8 = QbQuestion.model_validate(data)
    assert len(q8.options) == 8
    assert q8.answer_index == 7


def test_answer_index_out_of_bounds_rejected(sample_question):
    data = sample_question.model_dump()
    data["options"] = ["对", "错"]
    data["answer_index"] = 2
    data["content_hash"] = QbQuestion.compute_hash(data["stem"], data["options"], data["answer_index"])
    with pytest.raises(ValidationError, match="vượt quá số lượng phương án"):
        QbQuestion.model_validate(data)


def test_grouped_question_fields(sample_question):
    data = sample_question.model_dump()
    data["group_id"] = "grp_test_001"
    data["group_passage"] = "一段关于阅读理解的长文章..."
    data["group_options"] = ["选项A", "选项B", "选项C", "选项D", "选项E"]
    data["content_hash"] = QbQuestion.compute_hash(data["stem"], data["options"], data["answer_index"])
    q = QbQuestion.model_validate(data)
    assert q.group_id == "grp_test_001"
    assert q.group_passage == "一段关于阅读理解的长文章..."
    assert len(q.group_options) == 5

    # group_options validation: rejects duplicates
    data["group_options"] = ["选项A", "选项A"]
    with pytest.raises(ValidationError):
        QbQuestion.model_validate(data)

    # group_options validation: rejects < 2
    data["group_options"] = ["选项A"]
    with pytest.raises(ValidationError):
        QbQuestion.model_validate(data)

    # group_options validation: rejects > 10
    data["group_options"] = [f"Opt_{i}" for i in range(11)]
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

