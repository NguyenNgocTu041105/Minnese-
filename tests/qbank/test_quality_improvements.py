import json
import pytest
from unittest.mock import patch, MagicMock

from qbank.models import QbQuestion
from qbank.generator import QbGenerator, QbGenerationSummary
from qbank.llm import QbMockLLM
from qbank.syllabus import get_syllabus
from qbank.store import QbStore
from qbank.validators import validate_character_level


def test_item_11_xigua_distractor_dilution_fix():
    """
    Item 11: Investigate and verify fix for '西瓜' (stem character dilution).
    Stem: '爸爸买了一个大西瓜，我和哥哥一人吃____。' (16 Hanzi)
    Options: ['一半', '一点儿', '一些', '一下'] (9 Hanzi)
    Total with options was 25 Hanzi: 1 out-of-level char ('瓜' L3) / 25 = 4.0% <= 5% (diluted!).
    With filled stem ('爸爸买了一个大西瓜，我和哥哥一人吃一半'): 18 Hanzi -> 1 / 18 = 5.56% > 5%, correctly caught!
    """
    syllabus = get_syllabus()
    stem = "爸爸买了一个大西瓜，我和哥哥一人吃____。"
    options = ["一半", "一点儿", "一些", "一下"]
    correct_opt = options[0]

    # Filled stem evaluation
    filled_stem = stem.replace("____", correct_opt)
    ok, details, notes = validate_character_level(
        text=filled_stem,
        target_level=1,
        syllabus=syllabus,
        char_budget=0.05
    )

    assert ok is False
    over_chars = [c for c, lvl in details["over_level_chars"]]
    assert over_chars == ["瓜"]
    assert details["over_level_count"] == 1
    assert details["total_chars"] == 18
    assert details["ratio"] > 0.05  # 5.56% > 5.0%


def test_item_9_option_set_collision_flagged(tmp_path):
    """
    Item 9: Option set duplicate check.
    If the 4 options match an existing question in DB or batch -> flag as needs_review.
    """
    db_file = str(tmp_path / "test_qbank.db")
    store = QbStore(db_path=db_file)

    from qbank.models import QbProvenance, QbQA
    # Save an existing question with options: ["学校", "医院", "银行", "机场"]
    q1 = QbQuestion(
        question_id="qb_opt_1",
        level=1,
        skill="reading",
        part_type="fill_blank",
        stem="今天我想去____看书。",
        options=["学校", "医院", "银行", "机场"],
        answer_index=0,
        explanation_vi="Giải thích.",
        status="approved",
        content_hash=QbQuestion.compute_hash("今天我想去____看书。", ["学校", "医院", "银行", "机场"], 0),
        provenance=QbProvenance(origin="original_generated", batch_id="b_init", prompt_version="v1", llm_model="m", created_at="2026-01-01T00:00:00Z"),
        qa=QbQA(structure_ok=True, level_ok=True, notes=[])
    )
    store.save_question(q1)

    # Mock generator output that generates a question with the EXACT SAME option set (permuted)
    mock_payload = {
        "questions": [
            {
                "stem": "李华今天下午去____借了两本书。",
                "options": ["银行", "机场", "学校", "医院"],  # same frozenset!
                "answer_index": 2,
                "explanation_vi": "Giải thích.",
                "topic": "education",
                "vocab_tags": ["学校"]
            }
        ]
    }
    mock_llm = QbMockLLM(predefined_response=json.dumps(mock_payload, ensure_ascii=False))
    generator = QbGenerator(llm=mock_llm, store=store)

    summary = generator.generate(level=1, count=1, use_solver=False)
    assert summary.questions_saved == 1
    generated_q = summary.generated_questions[0]

    # Must be forced to needs_review due to option set duplicate!
    assert generated_q.status == "needs_review"
    assert any("Nghi vấn bộ lựa chọn trùng lặp" in n for n in generated_q.qa.notes)


def test_item_10_allowed_chars_list_injected_into_prompt(tmp_path):
    """
    Item 10: Generator injects allowed characters list into prompt template.
    """
    db_file = str(tmp_path / "test_qbank.db")
    store = QbStore(db_path=db_file)
    mock_llm = QbMockLLM()
    generator = QbGenerator(llm=mock_llm, store=store)

    captured_prompts = []
    def fake_generate(messages, **kwargs):
        captured_prompts.append(messages[1]["content"])
        return mock_llm.generate_chat_completion(messages, **kwargs)

    mock_llm.generate_chat_completion = fake_generate
    generator.generate(level=1, count=1, use_solver=False)

    assert len(captured_prompts) > 0
    prompt_text = captured_prompts[0]
    # Check that {allowed_chars_list} placeholder was replaced by actual HSK 1 characters
    assert "{allowed_chars_list}" not in prompt_text
    # HSK 1 common characters must be present
    assert "我" in prompt_text
    assert "你" in prompt_text
    assert "他" in prompt_text


def test_item_12_token_usage_tracked_by_model(tmp_path):
    """
    Item 12: Token usage is tracked and aggregated by model in QbGenerationSummary.
    """
    db_file = str(tmp_path / "test_qbank.db")
    store = QbStore(db_path=db_file)
    mock_llm = QbMockLLM()
    # MockLLM sets last_usage = {"prompt_tokens": 120, "completion_tokens": 80, "total_tokens": 200}
    generator = QbGenerator(llm=mock_llm, store=store)

    summary = generator.generate(level=1, count=2, use_solver=False)
    assert "mock-llm" in summary.token_usage_by_model
    stats = summary.token_usage_by_model["mock-llm"]
    assert stats["prompt_tokens"] >= 120
    assert stats["completion_tokens"] >= 80
    assert stats["total_tokens"] >= 200


def test_sampling_seed_deterministic_reproducibility(tmp_path):
    """
    QBANK_SAMPLING_SEED makes target vocabulary selection deterministic across runs.
    """
    from qbank.config import QbConfig
    db1 = str(tmp_path / "db1.db")
    db2 = str(tmp_path / "db2.db")

    cfg1 = QbConfig(sampling_seed=42, db_path=db1)
    cfg2 = QbConfig(sampling_seed=42, db_path=db2)
    cfg3 = QbConfig(sampling_seed=999, db_path=str(tmp_path / "db3.db"))

    captured_prompts_1 = []
    class Mock1(QbMockLLM):
        def generate_chat_completion(self, messages, **kwargs):
            captured_prompts_1.append(messages[1]["content"])
            return super().generate_chat_completion(messages, **kwargs)

    g1 = QbGenerator(llm=Mock1(), store=QbStore(db_path=db1), config=cfg1)
    g1.generate(level=1, count=5, use_solver=False)

    captured_prompts_2 = []
    class Mock2(QbMockLLM):
        def generate_chat_completion(self, messages, **kwargs):
            captured_prompts_2.append(messages[1]["content"])
            return super().generate_chat_completion(messages, **kwargs)

    g2 = QbGenerator(llm=Mock2(), store=QbStore(db_path=db2), config=cfg2)
    g2.generate(level=1, count=5, use_solver=False)

    captured_prompts_3 = []
    class Mock3(QbMockLLM):
        def generate_chat_completion(self, messages, **kwargs):
            captured_prompts_3.append(messages[1]["content"])
            return super().generate_chat_completion(messages, **kwargs)

    g3 = QbGenerator(llm=Mock3(), store=QbStore(db_path=str(tmp_path / "db3.db")), config=cfg3)
    g3.generate(level=1, count=5, use_solver=False)

    assert len(captured_prompts_1) > 0
    assert len(captured_prompts_2) > 0
    assert len(captured_prompts_3) > 0
    # Seed 42 on db1 and db2 must produce the EXACT SAME prompt vocab list
    assert captured_prompts_1[0] == captured_prompts_2[0]
    # Seed 999 produces a different target vocab order
    assert captured_prompts_1[0] != captured_prompts_3[0]


def test_regression_xigua_question_flagged_in_generator(tmp_path):
    """
    Regression test: The generator must flag the '西瓜' question as out-of-level in HSK 1,
    forcing status to 'needs_review' even with auto_approve enabled.
    """
    from qbank.config import QbConfig
    db_file = str(tmp_path / "test_qbank.db")
    store = QbStore(db_path=db_file)
    cfg = QbConfig(auto_approve=True, db_path=db_file)

    mock_payload = {
        "questions": [
            {
                "stem": "爸爸买了一个大西瓜，我和哥哥一人吃____。",
                "options": ["一半", "一点儿", "一些", "一下"],
                "answer_index": 0,
                "explanation_vi": "Giải thích mẫu.",
                "topic": "daily_life",
                "vocab_tags": ["一半"]
            }
        ]
    }
    mock_llm = QbMockLLM(predefined_response=json.dumps(mock_payload, ensure_ascii=False))
    generator = QbGenerator(llm=mock_llm, store=store, config=cfg)

    summary = generator.generate(level=1, count=1, use_solver=False)
    assert summary.questions_saved == 1
    q = summary.generated_questions[0]

    # Character-level validation must fail on filled stem (1 / 18 = 5.56% > 5%)
    assert q.qa.level_ok is False
    assert any("瓜(L3)" in n for n in q.qa.notes)
    # Even though auto_approve=True, status MUST be needs_review!
    assert q.status == "needs_review"


def test_uniform_blank_replacement_regex_supports_three_underscores_and_brackets(tmp_path):
    """
    Feature F7: Uniform blank replacement supports 3+ underscores, （ ）, and ( ).
    Replaces the blank placeholder directly in the stem instead of appending to the end,
    ensuring character validation evaluates the exact filled stem.
    """
    from qbank.config import QbConfig
    db_file = str(tmp_path / "test_qbank.db")
    store = QbStore(db_path=db_file)
    cfg = QbConfig(auto_approve=True, db_path=db_file, out_of_level_threshold=1.0)

    # Test 3 underscore variants and brackets: "___", "（ ）", "( )" with distinct option sets
    test_cases = [
        ("今天天气很好，我想去___。", ["学校", "中国", "北京", "大家"]),
        ("每天下午，妹妹都在房间里（ ）。", ["看书", "听话", "写字", "做饭"]),
        ("桌子上的苹果很( )。", ["大", "小", "多", "少"])
    ]

    for stem_pattern, opts in test_cases:
        payload = {
            "questions": [
                {
                    "stem": stem_pattern,
                    "options": opts,
                    "answer_index": 0,
                    "explanation_vi": "Giải thích ngắn gọn.",
                    "topic": "daily",
                    "vocab_tags": [opts[0]]
                }
            ]
        }
        mock_llm = QbMockLLM(predefined_response=json.dumps(payload, ensure_ascii=False))
        generator = QbGenerator(llm=mock_llm, store=store, config=cfg)
        summary = generator.generate(level=1, part_type="fill_blank", count=1, use_solver=False)
        assert summary.questions_saved == 1
        q = summary.generated_questions[0]
        assert q.qa.structure_ok is True
        assert q.status == "approved"


def test_small_vocab_pool_backfills_without_repeating_same_word_in_batch(test_store, test_syllabus):
    """
    Feature F12: When unused_vocab has fewer items than current_batch_count,
    backfill from all_vocab_words avoiding duplicates in the current batch subset.
    """
    from qbank.config import QbConfig
    from qbank.models import QbProvenance, QbQA

    # Mark 3 out of 4 Level 1 words as already used: 学校, 老师, 学生
    # Leaving only 1 unused word: 朋友
    used_words = ["学校", "老师", "学生"]
    for i, w in enumerate(used_words):
        q = QbQuestion(
            question_id=f"qb_used_{i}",
            level=1,
            skill="reading",
            part_type="fill_blank",
            stem=f"王老师在{w}工作。",
            options=[w, "医院", "银行", "商店"],
            answer_index=0,
            explanation_vi="Giải thích.",
            vocab_tags=[w],
            status="approved",
            content_hash=QbQuestion.compute_hash(f"王老师在{w}工作。", [w, "医院", "银行", "商店"], 0),
            provenance=QbProvenance(origin="original_generated", batch_id="b_init", prompt_version="v1", llm_model="m", created_at="2026-01-01T00:00:00Z"),
            qa=QbQA(structure_ok=True, level_ok=True, notes=[])
        )
        test_store.save_question(q)

    captured_prompts = []
    class PromptCapturingLLM(QbMockLLM):
        def generate_chat_completion(self, messages, **kwargs):
            self.calls_count += 1
            captured_prompts.append(messages[1]["content"])
            return json.dumps({
                "questions": [
                    {
                        "stem": "王老师今天在学校____。",
                        "options": ["上课", "看书", "睡觉", "吃饭"],
                        "answer_index": 0,
                        "explanation_vi": "Giảng bài.",
                        "topic": "school",
                        "vocab_tags": ["上课"]
                    },
                    {
                        "stem": "李华明天去医院____。",
                        "options": ["看病", "工作", "买药", "休息"],
                        "answer_index": 0,
                        "explanation_vi": "Khám bệnh.",
                        "topic": "health",
                        "vocab_tags": ["看病"]
                    },
                    {
                        "stem": "今天天气很好，我想去机场____。",
                        "options": ["接人", "坐车", "旅游", "看花"],
                        "answer_index": 0,
                        "explanation_vi": "Đón người.",
                        "topic": "travel",
                        "vocab_tags": ["接人"]
                    }
                ]
            })

    llm = PromptCapturingLLM()
    # Batch count = 3, but only 1 unused word exists
    config = QbConfig(max_calls_per_run=2, batch_size=3, out_of_level_threshold=1.0, sampling_seed=42)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    generator.generate(level=1, part_type="fill_blank", count=3, use_solver=False)

    assert len(captured_prompts) == 1
    prompt_text = captured_prompts[0]
    import re
    # Extract the vocabulary list line after 'danh sách sau:'
    match = re.search(r"danh sách sau:\s*\n([^\n]+)", prompt_text)
    assert match is not None
    vocab_line = match.group(1).strip()
    words_in_batch = [w.strip() for w in vocab_line.split(",") if w.strip()]

    # Must contain 3 words
    assert len(words_in_batch) == 3
    # The single unused word ("朋友") must be present
    assert "朋友" in words_in_batch
    # All 3 words in the batch must be unique (no duplicate words in single batch!)
    assert len(set(words_in_batch)) == 3


def test_generator_vocab_rotation_seed_determinism_thirty_runs(test_syllabus, tmp_path):
    """
    Verify seed determinism across 30 consecutive runs:
    With a fixed QBANK_SAMPLING_SEED, every single run must yield the exact
    same prompt and target vocabulary list.
    """
    import re
    from qbank.config import QbConfig

    captured_runs = []

    for i in range(30):
        db_path = str(tmp_path / f"test_seed_run_{i}.db")
        store = QbStore(db_path=db_path)

        captured_prompt = []

        class DeterministicLLM(QbMockLLM):
            def generate_chat_completion(self, messages, **kwargs):
                captured_prompt.append(messages[1]["content"])
                return json.dumps({
                    "questions": [
                        {
                            "stem": "王老师正在____上课。",
                            "options": ["学校", "医院", "银行", "机场"],
                            "answer_index": 0,
                            "explanation_vi": "Giải thích.",
                            "topic": "school",
                            "vocab_tags": ["学校"]
                        }
                    ]
                })

        llm = DeterministicLLM()
        config = QbConfig(max_calls_per_run=1, batch_size=2, out_of_level_threshold=1.0, sampling_seed=2026)
        generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=store, config=config)

        generator.generate(level=1, part_type="fill_blank", count=2, use_solver=False)

        assert len(captured_prompt) == 1
        prompt_text = captured_prompt[0]

        match = re.search(r"danh sách sau:\s*\n([^\n]+)", prompt_text)
        assert match is not None
        vocab_line = match.group(1).strip()
        vocab_list = [w.strip() for w in vocab_line.split(",") if w.strip()]

        captured_runs.append((prompt_text, vocab_list))

    # All 30 runs must be identical to the first run
    first_prompt, first_vocab = captured_runs[0]
    assert len(captured_runs) == 30
    for idx, (p, v) in enumerate(captured_runs[1:], start=2):
        assert p == first_prompt, f"Run {idx} prompt deviated from run 1"
        assert v == first_vocab, f"Run {idx} vocab list deviated from run 1"


def test_generator_vocab_exhaustion_full_cycle_reset(test_syllabus, tmp_path):
    """
    Test that when 100% of syllabus vocabulary has been marked as used in the store,
    the generator gracefully resets its vocabulary pool and continues generating
    without IndexError or crash.
    """
    from qbank.models import QbProvenance, QbQA
    from qbank.config import QbConfig

    db_path = str(tmp_path / "test_exhaustion.db")
    store = QbStore(db_path=db_path)

    level_vocab = test_syllabus.get_vocab_for_level(1)
    all_vocab_words = [v.word for v in level_vocab]
    assert len(all_vocab_words) > 0

    # Mark 100% of syllabus vocabulary as used in the store
    for idx, word in enumerate(all_vocab_words):
        q = QbQuestion(
            question_id=f"qb_exhausted_{idx}",
            level=1,
            skill="reading",
            part_type="fill_blank",
            stem=f"测试词汇{word}在句子中的使用____。",
            options=[word, "医院", "银行", "商店"],
            answer_index=0,
            explanation_vi="Giải thích.",
            vocab_tags=[word],
            status="approved",
            content_hash=QbQuestion.compute_hash(f"测试词汇{word}在句子中的使用____。", [word, "医院", "银行", "商店"], 0),
            provenance=QbProvenance(origin="original_generated", batch_id="b_exhaust", prompt_version="v1", llm_model="m", created_at="2026-01-01T00:00:00Z"),
            qa=QbQA(structure_ok=True, level_ok=True, notes=[])
        )
        store.save_question(q)

    # Verify that store indeed records all words as used
    with store.session() as conn:
        cur = conn.cursor()
        cur.execute("SELECT vocab_tags FROM qb_questions WHERE level = 1;")
        recorded_tags = set()
        for r in cur.fetchall():
            tags = json.loads(r["vocab_tags"]) if isinstance(r["vocab_tags"], str) else r["vocab_tags"]
            recorded_tags.update(tags)
    assert set(all_vocab_words).issubset(recorded_tags)

    captured_prompts = []

    class ExhaustionMockLLM(QbMockLLM):
        def generate_chat_completion(self, messages, **kwargs):
            self.calls_count += 1
            captured_prompts.append(messages[1]["content"])
            return json.dumps({
                "questions": [
                    {
                        "stem": "今天天气很好，我和朋友一起去____。",
                        "options": ["学校", "医院", "银行", "机场"],
                        "answer_index": 0,
                        "explanation_vi": "Giải thích ngữ cảnh.",
                        "topic": "school",
                        "vocab_tags": ["学校"]
                    },
                    {
                        "stem": "李老师在教室里给学生____。",
                        "options": ["讲课", "看书", "吃饭", "睡觉"],
                        "answer_index": 0,
                        "explanation_vi": "Giải thích.",
                        "topic": "school",
                        "vocab_tags": ["讲课"]
                    }
                ]
            })

    llm = ExhaustionMockLLM()
    config = QbConfig(max_calls_per_run=2, batch_size=2, out_of_level_threshold=1.0, sampling_seed=42)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=store, config=config)

    # Must generate successfully without IndexError, ZeroDivisionError, or crash
    summary = generator.generate(level=1, part_type="fill_blank", count=2, use_solver=False)

    assert summary.questions_saved == 2
    assert summary.batches_failed == 0
    assert len(summary.generated_questions) == 2
    for q in summary.generated_questions:
        assert q.status in ("approved", "needs_review")

    # The prompt should contain target words from the reset full syllabus pool
    assert len(captured_prompts) == 1
    prompt_text = captured_prompts[0]
    import re
    match = re.search(r"danh sách sau:\s*\n([^\n]+)", prompt_text)
    assert match is not None
    vocab_line = match.group(1).strip()
    words_in_batch = [w.strip() for w in vocab_line.split(",") if w.strip()]
    assert len(words_in_batch) == 2
    for w in words_in_batch:
        assert w in all_vocab_words

