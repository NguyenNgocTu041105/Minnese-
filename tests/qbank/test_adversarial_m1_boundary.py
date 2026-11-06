"""
Adversarial Challenger 1 (M1 Python Backend & Pydantic Boundary Suite)
File: tests/qbank/test_adversarial_m1_boundary.py

Empirically tests:
1. Pydantic validation of blueprints levels 1 to 6
2. Boundary rejection of invalid levels in load_blueprint and QbBlueprint
3. QbQuestion model validation for level 6 and boundary levels (0, -1, 7, 999, floats)
4. Topic variations in QbQuestion
"""

import pytest
from pydantic import ValidationError

from qbank.models import QbBlueprint, QbQuestion, QbProvenance, QbQA
from qbank.blueprint import (
    load_blueprint,
    load_blueprint_raw,
    list_blueprints,
    get_section_blueprint,
    get_part_blueprint,
)


def test_adversarial_list_blueprints():
    """Verify available blueprints list contains exactly 1 through 6."""
    levels = list_blueprints()
    assert levels == [1, 2, 3, 4, 5, 6], f"Expected levels 1-6, got {levels}"


def test_adversarial_pydantic_all_blueprints_valid():
    """Verify all blueprints 1..6 cleanly parse into Pydantic QbBlueprint."""
    for lvl in range(1, 7):
        bp = load_blueprint(lvl)
        assert isinstance(bp, QbBlueprint)
        assert bp.level == lvl
        assert bp.hsk_version == "3.0"
        assert bp.verified is False
        assert hasattr(bp, "verification")
        assert "verified_fields" in bp.verification
        assert "unverified_fields" in bp.verification
        assert len(bp.sections) >= 2

        # Check total questions and time consistency
        total_q = 0
        total_time = 0
        for s_name, sec in bp.sections.items():
            assert sec.name, f"Section {s_name} in level {lvl} missing name"
            assert len(sec.parts) > 0, f"Section {s_name} in level {lvl} has 0 parts"
            for p_name, part in sec.parts.items():
                assert part.type, f"Part {p_name} missing type"
                assert part.n_questions > 0, f"Part {p_name} n_questions <= 0"
                assert part.n_options >= 0, f"Part {p_name} n_options < 0"
                assert part.time_min >= 0, f"Part {p_name} time_min < 0"
                total_q += part.n_questions
                total_time += part.time_min

        # Level 6 specific check (calibrated in Phase 6 to CTI standards)
        if lvl == 6:
            assert total_q == 82, f"HSK 6 blueprint must have 82 questions, got {total_q}"
            assert getattr(bp, "total_time_min", None) == 125, f"HSK 6 total_time_min must be 125, got {getattr(bp, 'total_time_min', None)}"
            assert getattr(bp, "total_questions", None) == 82
            assert set(bp.sections.keys()) == {"listening", "reading", "writing"}


@pytest.mark.parametrize("invalid_lvl", [0, -1, -99, 7, 8, 999])
def test_adversarial_load_blueprint_boundary_levels_raise(invalid_lvl):
    """Verify load_blueprint rejects out-of-boundary integer levels."""
    with pytest.raises(ValueError, match="không hợp lệ"):
        load_blueprint(invalid_lvl)


@pytest.mark.parametrize("non_int_lvl", ["6", 2.5, None, [], {}])
def test_adversarial_load_blueprint_non_integer_levels_raise(non_int_lvl):
    """Verify load_blueprint rejects non-integer levels."""
    with pytest.raises(ValueError, match="không hợp lệ"):
        load_blueprint(non_int_lvl)  # type: ignore


def test_adversarial_qbquestion_level6_valid():
    """Verify QbQuestion accepts valid HSK 6 question with topic."""
    stem = "这项研究的____在于揭示了深层机制。"
    opts = ["本质", "表象", "形式", "皮毛"]
    ans_idx = 0
    chash = QbQuestion.compute_hash(stem, opts, ans_idx)

    q = QbQuestion(
        question_id="test_hsk6_001",
        level=6,
        skill="reading",
        part_type="read_fill_blank_4opt",
        stem=stem,
        options=opts,
        answer_index=ans_idx,
        explanation_vi="Giải thích tiếng Việt chi tiết.",
        topic="Khoa học & Nghiên cứu",
        provenance=QbProvenance(
            batch_id="batch_01",
            prompt_version="v3.0",
            llm_model="deepseek-v3",
            created_at="2026-10-20T00:00:00Z",
        ),
        qa=QbQA(),
        content_hash=chash,
    )

    assert q.level == 6
    assert q.topic == "Khoa học & Nghiên cứu"
    assert q.content_hash == chash


@pytest.mark.parametrize("invalid_lvl", [0, -1, 7, 999])
def test_adversarial_qbquestion_boundary_levels_rejected(invalid_lvl):
    """Verify QbQuestion strictly rejects level < 1 or level > 6 via Pydantic validator."""
    stem = "这是一个测试句子____。"
    opts = ["A", "B", "C", "D"]
    ans_idx = 0
    chash = QbQuestion.compute_hash(stem, opts, ans_idx)

    with pytest.raises(ValidationError):
        QbQuestion(
            question_id="test_invalid_level",
            level=invalid_lvl,
            skill="reading",
            part_type="read_fill_blank_4opt",
            stem=stem,
            options=opts,
            answer_index=ans_idx,
            explanation_vi="Giải thích chi tiết hợp lệ.",
            topic="Test",
            provenance=QbProvenance(
                batch_id="batch_01",
                prompt_version="v3.0",
                llm_model="deepseek-v3",
                created_at="2026-10-20T00:00:00Z",
            ),
            qa=QbQA(),
            content_hash=chash,
        )


def test_adversarial_qbquestion_float_level_rejected():
    """Verify QbQuestion rejects non-integer float level like 2.5."""
    stem = "这是一个测试句子____。"
    opts = ["A", "B", "C", "D"]
    ans_idx = 0
    chash = QbQuestion.compute_hash(stem, opts, ans_idx)

    with pytest.raises(ValidationError):
        QbQuestion(
            question_id="test_float_level",
            level=2.5,  # type: ignore
            skill="reading",
            part_type="read_fill_blank_4opt",
            stem=stem,
            options=opts,
            answer_index=ans_idx,
            explanation_vi="Giải thích chi tiết hợp lệ.",
            topic="Test",
            provenance=QbProvenance(
                batch_id="batch_01",
                prompt_version="v3.0",
                llm_model="deepseek-v3",
                created_at="2026-10-20T00:00:00Z",
            ),
            qa=QbQA(),
            content_hash=chash,
        )
