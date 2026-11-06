import json
import pytest
from unittest.mock import MagicMock, patch
import argparse

from qbank.models import QbBlueprint, QbBlueprintSection, QbBlueprintPart, QbQuestion
from qbank.blueprint import (
    load_blueprint,
    load_blueprint_raw,
    list_blueprints,
    get_section_blueprint,
    get_part_blueprint,
)
from qbank.config import QbConfig
from qbank.generator import QbGenerator
from qbank.llm import QbMockLLM
from qbank.cli import handle_blueprint, handle_generate, build_parser


def test_list_blueprints():
    """Verifies that available blueprint levels 1 to 6 are discovered."""
    levels = list_blueprints()
    assert levels == [1, 2, 3, 4, 5, 6]


def test_load_all_blueprints():
    """Verifies that all 6 blueprints load and validate cleanly against QbBlueprint."""
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


def test_blueprint_hsk1_specs():
    """Verifies official CLEC HSK 1 blueprint specifications."""
    bp = load_blueprint(1)
    assert set(bp.sections.keys()) == {"listening", "reading"}

    listening = bp.sections["listening"]
    reading = bp.sections["reading"]

    # Question counts: 20 Listening + 20 Reading = 40 Total
    assert sum(p.n_questions for p in listening.parts.values()) == 20
    assert sum(p.n_questions for p in reading.parts.values()) == 20
    assert len(listening.parts) == 4
    assert len(reading.parts) == 4

    # Option counts: 3 options for multiple choice
    assert listening.parts["listening_1"].n_options == 3
    assert listening.parts["listening_2"].n_options == 3
    assert reading.parts["reading_4"].n_options == 3

    # Rich metadata
    assert getattr(bp, "total_questions", None) == 40
    assert getattr(bp, "total_time_min", None) == 40
    assert getattr(bp, "max_score", None) == 200
    assert getattr(bp, "passing_score", None) == 120
    assert getattr(bp, "has_pinyin", None) is True
    assert getattr(bp, "audio_playback", None) == 2


def test_blueprint_hsk2_specs():
    """Verifies official CLEC HSK 2 blueprint specifications."""
    bp = load_blueprint(2)
    assert set(bp.sections.keys()) == {"listening", "reading", "writing"}

    listening = bp.sections["listening"]
    reading = bp.sections["reading"]
    writing = bp.sections["writing"]

    # Question counts: 25 Listening + 25 Reading + 10 Writing = 60 Total
    assert sum(p.n_questions for p in listening.parts.values()) == 25
    assert sum(p.n_questions for p in reading.parts.values()) == 25
    assert sum(p.n_questions for p in writing.parts.values()) == 10

    # Writing breakdown: 5 radical assembly + 5 pinyin handwriting
    assert writing.parts["writing_1"].n_questions == 5
    assert writing.parts["writing_1"].type == "write_component_assembly_6opt"
    assert writing.parts["writing_2"].n_questions == 5
    assert writing.parts["writing_2"].type == "write_tianzige_from_pinyin"

    # Rich metadata
    assert getattr(bp, "total_questions", None) == 60
    assert getattr(bp, "total_time_min", None) == 60
    assert getattr(bp, "max_score", None) == 300
    assert getattr(bp, "passing_score", None) == 180
    assert getattr(bp, "has_pinyin", None) is True
    assert getattr(bp, "audio_playback", None) == 2


def test_blueprint_hsk3_specs():
    """Verifies official CLEC HSK 3 blueprint specifications."""
    bp = load_blueprint(3)
    assert set(bp.sections.keys()) == {"listening", "reading", "writing"}

    listening = bp.sections["listening"]
    reading = bp.sections["reading"]
    writing = bp.sections["writing"]

    # Question counts: 30 Listening + 30 Reading + 10 Writing = 70 Total
    assert sum(p.n_questions for p in listening.parts.values()) == 30
    assert sum(p.n_questions for p in reading.parts.values()) == 30
    assert sum(p.n_questions for p in writing.parts.values()) == 10

    # Writing: 5 sentence reorder + 5 pinyin handwriting
    assert writing.parts["writing_1"].n_questions == 5
    assert writing.parts["writing_1"].type == "write_sentence_reorder_4opt"
    assert writing.parts["writing_2"].n_questions == 5
    assert writing.parts["writing_2"].type == "write_tianzige_from_pinyin"

    # Options count for MCQs is 3
    assert listening.parts["listening_2"].n_options == 3
    assert reading.parts["reading_3"].n_options == 3

    # Rich metadata
    assert getattr(bp, "total_questions", None) == 70
    assert getattr(bp, "total_time_min", None) == 83
    assert getattr(bp, "has_pinyin", None) is False
    assert getattr(bp, "audio_playback", None) == 2


def test_blueprint_hsk4_specs():
    """Verifies official CLEC HSK 4 blueprint specifications."""
    bp = load_blueprint(4)
    assert set(bp.sections.keys()) == {"listening", "reading", "writing"}

    listening = bp.sections["listening"]
    reading = bp.sections["reading"]
    writing = bp.sections["writing"]

    # Question counts: 32 Listening + 32 Reading + 15 Writing = 79 Total
    assert sum(p.n_questions for p in listening.parts.values()) == 32
    assert sum(p.n_questions for p in reading.parts.values()) == 32
    assert sum(p.n_questions for p in writing.parts.values()) == 15

    # Reading cloze sentence insertion (7 items)
    assert reading.parts["reading_3"].type == "read_cloze_passage_sentence_insertion"
    assert reading.parts["reading_3"].n_questions == 7

    # Writing: 10 sentence reorder + 5 picture sentences
    assert writing.parts["writing_1"].n_questions == 10
    assert writing.parts["writing_1"].type == "write_sentence_reorder_4opt"
    assert writing.parts["writing_2"].n_questions == 5
    assert writing.parts["writing_2"].type == "write_sentence_from_picture_word"

    # Options count transitions to 4
    assert listening.parts["listening_1"].n_options == 4
    assert reading.parts["reading_2"].n_options == 4

    # Audio playback is 1 time
    assert getattr(bp, "audio_playback", None) == 1
    assert getattr(bp, "total_questions", None) == 79
    assert getattr(bp, "total_time_min", None) == 85


def test_blueprint_hsk5_specs():
    """Verifies official CLEC HSK 5 blueprint specifications."""
    bp = load_blueprint(5)
    assert set(bp.sections.keys()) == {"listening", "reading", "writing"}

    listening = bp.sections["listening"]
    reading = bp.sections["reading"]
    writing = bp.sections["writing"]

    # Question counts: 35 Listening + 35 Reading + 10 Writing = 80 Total
    assert sum(p.n_questions for p in listening.parts.values()) == 35
    assert sum(p.n_questions for p in reading.parts.values()) == 35
    assert sum(p.n_questions for p in writing.parts.values()) == 10

    # Reading: cloze (10) + paragraph ordering (10) + long reading (15)
    assert reading.parts["reading_1"].n_questions == 10
    assert reading.parts["reading_1"].type == "read_cloze_passages_4opt"
    assert reading.parts["reading_2"].n_questions == 10
    assert reading.parts["reading_2"].type == "read_paragraph_sentence_ordering"
    assert reading.parts["reading_3"].n_questions == 15
    assert reading.parts["reading_3"].type == "read_comprehension_long_articles_4opt"

    # Writing: sentence reorder (8) + 5-words short essay (1) + picture essay (1)
    assert writing.parts["writing_1"].n_questions == 8
    assert writing.parts["writing_1"].type == "write_sentence_reorder_4opt"
    assert writing.parts["writing_2"].n_questions == 1
    assert writing.parts["writing_2"].type == "write_short_essay_80chars"
    assert writing.parts["writing_3"].n_questions == 1
    assert writing.parts["writing_3"].type == "write_sentence_from_picture_word"

    # Rich metadata
    assert getattr(bp, "audio_playback", None) == 1
    assert getattr(bp, "total_questions", None) == 80
    assert getattr(bp, "total_time_min", None) == 110


def test_blueprint_hsk6_specs():
    """Verifies official CLEC HSK 6 blueprint specifications."""
    bp = load_blueprint(6)
    assert set(bp.sections.keys()) == {"listening", "reading", "writing"}

    listening = bp.sections["listening"]
    reading = bp.sections["reading"]
    writing = bp.sections["writing"]

    # Question counts: 40 Listening + 40 Reading + 2 Writing = 82 Total (calibrated in Phase 6 to CTI standards)
    assert sum(p.n_questions for p in listening.parts.values()) == 40
    assert sum(p.n_questions for p in reading.parts.values()) == 40
    assert sum(p.n_questions for p in writing.parts.values()) == 2

    # Reading parts check
    assert reading.parts["reading_1"].type == "read_find_faulty_sentence_4opt"
    assert reading.parts["reading_2"].type == "read_cloze_passages_4opt"
    assert reading.parts["reading_3"].type == "read_comprehension_long_articles_4opt"

    # Writing parts check
    assert writing.parts["writing_1"].type == "write_summary_shortening_400chars"
    assert writing.parts["writing_2"].type == "write_topic_essay_300chars"

    # Rich metadata
    assert getattr(bp, "audio_playback", None) == 1
    assert getattr(bp, "total_questions", None) == 82
    assert getattr(bp, "total_time_min", None) == 125
    assert getattr(bp, "max_score", None) == 300
    assert getattr(bp, "passing_score", None) == 180
    assert getattr(bp, "has_pinyin", None) is False


def test_load_blueprint_invalid_level():
    """Verifies that invalid levels raise ValueError or FileNotFoundError gracefully."""
    with pytest.raises(ValueError, match="Level 0 không hợp lệ"):
        load_blueprint(0)

    with pytest.raises(ValueError, match="Level 7 không hợp lệ"):
        load_blueprint(7)

    with pytest.raises(ValueError, match="Level -2 không hợp lệ"):
        load_blueprint(-2)

    with pytest.raises(ValueError):
        load_blueprint("abc")  # type: ignore

    with patch("os.path.isfile", return_value=False):
        with pytest.raises(FileNotFoundError, match="Không tìm thấy file blueprint"):
            load_blueprint(6)


def test_get_section_blueprint():
    """Verifies get_section_blueprint works and handles edge cases."""
    sec = get_section_blueprint(1, "listening")
    assert isinstance(sec, QbBlueprintSection)
    assert sec.name == "听力 (Listening)"

    # Case insensitivity & whitespace trimming
    sec_case = get_section_blueprint(1, "  READING  ")
    assert sec_case.name == "阅读 (Reading)"

    # Non-existent section raises KeyError
    with pytest.raises(KeyError, match="Phần thi 'speaking' không tồn tại"):
        get_section_blueprint(1, "speaking")


def test_get_part_blueprint():
    """Verifies get_part_blueprint finds parts across sections."""
    part1 = get_part_blueprint(1, "listening_1")
    assert isinstance(part1, QbBlueprintPart)
    assert part1.type == "listen_picture_match_3opt"

    part_write = get_part_blueprint(2, "writing_1")
    assert isinstance(part_write, QbBlueprintPart)
    assert part_write.n_questions == 5

    missing = get_part_blueprint(1, "nonexistent_part")
    assert missing is None


def test_load_blueprint_raw():
    """Verifies raw blueprint dictionary loading."""
    raw = load_blueprint_raw(1)
    assert isinstance(raw, dict)
    assert raw["level"] == 1
    assert raw["total_questions"] == 40
    assert "sections" in raw


def test_generator_custom_skill(test_store, test_syllabus):
    """Verifies that QbGenerator respects explicitly specified skill."""
    batch_json = json.dumps({
        "questions": [
            {
                "stem": "请听一段对话：今天下午有汉语课吗？",
                "options": ["有", "没有", "不知道"],
                "answer_index": 0,
                "explanation_vi": "Người nói xác nhận chiều nay có tiết học.",
                "topic": "school",
                "vocab_tags": ["下午", "汉语"]
            }
        ]
    })

    class CustomMockLLM(QbMockLLM):
        def generate_chat_completion(self, messages, **kwargs):
            return batch_json

    llm = CustomMockLLM()
    config = QbConfig(max_calls_per_run=2, batch_size=1, auto_approve=True)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    # 1. Generate with skill="listening"
    summary_listen = generator.generate(
        level=1,
        part_type="listen_question_answer_3opt",
        count=1,
        dry_run=True,
        use_solver=False,
        skill="listening"
    )
    assert len(summary_listen.generated_questions) == 1
    assert summary_listen.generated_questions[0].skill == "listening"

    # 2. Generate with skill="writing"
    summary_write = generator.generate(
        level=2,
        part_type="write_tianzige_from_pinyin",
        count=1,
        dry_run=True,
        use_solver=False,
        skill="writing"
    )
    assert len(summary_write.generated_questions) == 1
    assert summary_write.generated_questions[0].skill == "writing"

    # 3. Invalid skill raises ValueError
    with pytest.raises(ValueError, match="Skill 'invalid_skill' không hợp lệ"):
        generator.generate(level=1, count=1, skill="invalid_skill")


def test_generator_section_generation(test_store, test_syllabus):
    """Verifies that generate_section iterates over parts defined in the section blueprint."""
    batch_json = json.dumps({
        "questions": [
            {
                "stem": "昨天去书店买了一本新汉字书。",
                "options": ["书店", "学校", "医院", "饭馆"],
                "answer_index": 0,
                "explanation_vi": "Ngữ cảnh mua sách tại hiệu sách.",
                "topic": "daily_life",
                "vocab_tags": ["书店", "买"]
            }
        ]
    })

    class MultiPartMockLLM(QbMockLLM):
        def generate_chat_completion(self, messages, **kwargs):
            return batch_json

    llm = MultiPartMockLLM()
    config = QbConfig(max_calls_per_run=10, batch_size=1, auto_approve=True)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    # Generate section 'reading' for Level 1 (has 4 parts)
    summaries = generator.generate_section(
        level=1,
        section="reading",
        count_per_part=1,
        dry_run=True,
        use_solver=False
    )

    assert len(summaries) == 4
    expected_parts = [
        "read_sentence_picture_match_6opt",
        "read_dialogue_matching_6opt",
        "read_fill_blank_word_bank_6opt",
        "read_comprehension_short_3opt"
    ]
    assert [s.part_type for s in summaries] == expected_parts
    for s in summaries:
        assert s.questions_saved == 1
        assert all(q.skill == "reading" for q in s.generated_questions)


def test_cli_blueprint_command(capsys):
    """Verifies CLI blueprint command functionality."""
    # 1. Listing all blueprints
    args_list = argparse.Namespace(level=None)
    ret_list = handle_blueprint(args_list)
    assert ret_list == 0
    captured = capsys.readouterr().out
    assert "DANH SÁCH BLUEPRINT ĐỀ THI HSK 3.0 CHUẨN" in captured
    assert "HSK 1 [UNVERIFIED]: 40 câu, 40 phút" in captured
    assert "HSK 5 [UNVERIFIED]: 80 câu, 110 phút" in captured

    # 2. Inspecting single level
    args_l1 = argparse.Namespace(level=1, section=None, json=False)
    ret_l1 = handle_blueprint(args_l1)
    assert ret_l1 == 0
    captured_l1 = capsys.readouterr().out
    assert "BLUEPRINT ĐỀ THI HSK 1 (CHUẨN 3.0)" in captured_l1
    assert "听力 (Listening)" in captured_l1
    assert "阅读 (Reading)" in captured_l1

    # 3. Inspecting single section
    args_sec = argparse.Namespace(level=2, section="writing", json=False)
    ret_sec = handle_blueprint(args_sec)
    assert ret_sec == 0
    captured_sec = capsys.readouterr().out
    assert "CHI TIẾT PHẦN THI 'WRITING' - HSK 2" in captured_sec
    assert "write_component_assembly_6opt" in captured_sec
    assert "write_tianzige_from_pinyin" in captured_sec

    # 4. JSON output
    args_json = argparse.Namespace(level=3, section=None, json=True)
    ret_json = handle_blueprint(args_json)
    assert ret_json == 0
    captured_json = capsys.readouterr().out
    parsed = json.loads(captured_json)
    assert parsed["level"] == 3
    assert "verification" in parsed
    assert parsed["verification"]["verified_fields"] == ["total_questions", "time_limit_minutes"]
    assert parsed["total_questions"] == 70
    assert parsed["total_time_min"] == 83
    assert parsed["max_score"] == 300
    assert parsed["passing_score"] == 180
    assert parsed["has_pinyin"] is False
    assert parsed["audio_playback"] == 2


def test_blueprint_json_preserves_all_metadata_levels(capsys):
    """Verifies that blueprint --json preserves all rich exam metadata across levels 1-5."""
    expected_meta = {
        1: {"total_questions": 40, "total_time_min": 40, "max_score": 200, "passing_score": 120, "has_pinyin": True, "audio_playback": 2},
        2: {"total_questions": 60, "total_time_min": 60, "max_score": 300, "passing_score": 180, "has_pinyin": True, "audio_playback": 2},
        3: {"total_questions": 70, "total_time_min": 83, "max_score": 300, "passing_score": 180, "has_pinyin": False, "audio_playback": 2},
        4: {"total_questions": 79, "total_time_min": 85, "max_score": 300, "passing_score": 180, "has_pinyin": False, "audio_playback": 1},
        5: {"total_questions": 80, "total_time_min": 110, "max_score": 300, "passing_score": 180, "has_pinyin": False, "audio_playback": 1},
        6: {"total_questions": 82, "total_time_min": 125, "max_score": 300, "passing_score": 180, "has_pinyin": False, "audio_playback": 1},
    }
    for lvl, meta in expected_meta.items():
        args = argparse.Namespace(level=lvl, section=None, json=True)
        ret = handle_blueprint(args)
        assert ret == 0
        captured = capsys.readouterr().out
        data = json.loads(captured)
        assert data["level"] == lvl
        for k, v in meta.items():
            assert data[k] == v, f"HSK {lvl} metadata '{k}' mismatch: expected {v}, got {data.get(k)}"


def test_generator_split_and_ordering_options_derivation(test_store, test_syllabus):
    """Verifies that generator expected_opts logic supports 6 options for 'split' and 5 options for 'ordering'."""
    # 1. 'split' part with 6 options (HSK 2 / 3 matching & split parts)
    split_payload = json.dumps({
        "questions": [
            {
                "stem": "请把下列词语与句子配对。",
                "options": ["苹果", "香蕉", "西瓜", "米饭", "茶", "水"],
                "answer_index": 0,
                "explanation_vi": "Giải thích hợp lệ cho câu hỏi 6 phương án.",
                "topic": "food",
                "vocab_tags": ["苹果"]
            }
        ]
    })
    llm_split = QbMockLLM(predefined_response=split_payload)
    cfg = QbConfig(max_calls_per_run=2, batch_size=1, auto_approve=True, out_of_level_threshold=1.0)
    gen_split = QbGenerator(llm=llm_split, syllabus=test_syllabus, store=test_store, config=cfg)

    # Test with read_sentence_matching_split
    summary_split = gen_split.generate(
        level=3,
        part_type="read_sentence_matching_split",
        count=1,
        dry_run=True,
        use_solver=False
    )
    assert len(summary_split.generated_questions) == 1
    assert summary_split.questions_saved == 1
    assert len(summary_split.generated_questions[0].options) == 6
    assert summary_split.generated_questions[0].qa.structure_ok is True

    # 2. 'ordering' part with 5 options (HSK 5 paragraph sentence ordering)
    ordering_payload = json.dumps({
        "questions": [
            {
                "stem": "将下列句子重新排列成通顺的语段。",
                "options": ["第一句话", "第二句话", "第三句话", "第四句话", "第五句话"],
                "answer_index": 2,
                "explanation_vi": "Giải thích hợp lệ cho câu hỏi sắp xếp thứ tự 5 câu.",
                "topic": "logic",
                "vocab_tags": []
            }
        ]
    })
    llm_ord = QbMockLLM(predefined_response=ordering_payload)
    gen_ord = QbGenerator(llm=llm_ord, syllabus=test_syllabus, store=test_store, config=cfg)

    summary_ord = gen_ord.generate(
        level=5,
        part_type="read_paragraph_sentence_ordering",
        count=1,
        dry_run=True,
        use_solver=False
    )
    assert len(summary_ord.generated_questions) == 1
    assert summary_ord.questions_saved == 1
    assert len(summary_ord.generated_questions[0].options) == 5
    assert summary_ord.generated_questions[0].qa.structure_ok is True


def test_cli_generate_n_argument_forwarding():
    """Verifies that CLI --n is properly parsed and passed to generate_section."""
    parser = build_parser()

    # Case 1: --n 5 explicitly specified with --section
    args_explicit_5 = parser.parse_args(["generate", "--level", "2", "--section", "listening", "--n", "5"])
    assert args_explicit_5.n == 5
    with patch("qbank.cli.QbGenerator") as MockGen:
        mock_instance = MagicMock()
        mock_instance.generate_section.return_value = []
        MockGen.return_value = mock_instance

        handle_generate(args_explicit_5)
        mock_instance.generate_section.assert_called_once()
        _, kwargs = mock_instance.generate_section.call_args
        assert kwargs["count_per_part"] == 5

    # Case 2: --n omitted with --section -> count_per_part must be None (defer to blueprint)
    args_no_n = parser.parse_args(["generate", "--level", "2", "--section", "listening"])
    assert args_no_n.n is None
    with patch("qbank.cli.QbGenerator") as MockGen:
        mock_instance = MagicMock()
        mock_instance.generate_section.return_value = []
        MockGen.return_value = mock_instance

        handle_generate(args_no_n)
        mock_instance.generate_section.assert_called_once()
        _, kwargs = mock_instance.generate_section.call_args
        assert kwargs["count_per_part"] is None

    # Case 3: --n 10 explicitly specified with --section
    args_explicit_10 = parser.parse_args(["generate", "--level", "1", "--section", "reading", "--n", "10"])
    assert args_explicit_10.n == 10
    with patch("qbank.cli.QbGenerator") as MockGen:
        mock_instance = MagicMock()
        mock_instance.generate_section.return_value = []
        MockGen.return_value = mock_instance

        handle_generate(args_explicit_10)
        mock_instance.generate_section.assert_called_once()
        _, kwargs = mock_instance.generate_section.call_args
        assert kwargs["count_per_part"] == 10

    # Case 4: single part generate without --n -> defaults to count=5
    args_single_no_n = parser.parse_args(["generate", "--level", "1", "--part", "fill_blank"])
    assert args_single_no_n.n is None
    with patch("qbank.cli.QbGenerator") as MockGen:
        mock_instance = MagicMock()
        mock_instance.generate.return_value = MagicMock(
            batch_id="b1", requested_count=5, calls_made=1, batches_attempted=1,
            batches_failed=0, split_batch_count=0, fallback_count=0, questions_generated=5,
            questions_saved=5, approved_count=5, needs_review_count=0,
            rejected_validation_count=0, duplicate_count=0, models_used={}
        )
        MockGen.return_value = mock_instance

        handle_generate(args_single_no_n)
        mock_instance.generate.assert_called_once()
        _, kwargs = mock_instance.generate.call_args
        assert kwargs["count"] == 5

    # Case 5: single part generate with --n 3 -> uses count=3
    args_single_n3 = parser.parse_args(["generate", "--level", "1", "--part", "fill_blank", "--n", "3"])
    assert args_single_n3.n == 3
    with patch("qbank.cli.QbGenerator") as MockGen:
        mock_instance = MagicMock()
        mock_instance.generate.return_value = MagicMock(
            batch_id="b1", requested_count=3, calls_made=1, batches_attempted=1,
            batches_failed=0, split_batch_count=0, fallback_count=0, questions_generated=3,
            questions_saved=3, approved_count=3, needs_review_count=0,
            rejected_validation_count=0, duplicate_count=0, models_used={}
        )
        MockGen.return_value = mock_instance

        handle_generate(args_single_n3)
        mock_instance.generate.assert_called_once()
        _, kwargs = mock_instance.generate.call_args
        assert kwargs["count"] == 3
