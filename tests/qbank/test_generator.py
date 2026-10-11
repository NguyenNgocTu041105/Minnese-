import json
import pytest
from qbank.config import QbConfig
from qbank.generator import QbGenerator, extract_json_block
from qbank.llm import QbMockLLM
from qbank.models import QbQuestion



def test_extract_json_block():
    # Markdown fence
    raw1 = "Here is the JSON:\n```json\n{\"questions\": []}\n```\nHope it helps!"
    assert extract_json_block(raw1) == '{"questions": []}'

    # Raw text without fence
    raw2 = "Some prefix {\"key\": 123} some suffix"
    assert extract_json_block(raw2) == '{"key": 123}'

    # Array fence
    raw3 = "```\n[1, 2, 3]\n```"
    assert extract_json_block(raw3) == '[1, 2, 3]'


def test_generator_successful_batch(test_store, test_syllabus):
    valid_batch_json = json.dumps({
        "questions": [
            {
                "stem": "今天天气很好，我想去____借两本书。",
                "options": ["学校", "老师", "朋友", "准备"],
                "answer_index": 0,
                "explanation_vi": "Ngữ cảnh đi mượn sách thì địa điểm phù hợp là '学校'.",
                "topic": "daily_life",
                "vocab_tags": ["学校", "借", "书"]
            }
        ]
    })

    solver_json = json.dumps({
        "evaluations": [
            {
                "index": 0,
                "acceptable_options": [0],
                "analysis": {"0": "学校 là địa điểm mượn sách hợp lý."}
            }
        ]
    })

    # Mock LLM that alternates between question generation and solver
    class AlternatingMockLLM(QbMockLLM):
        def generate_chat_completion(self, messages, **kwargs):
            self.calls_count += 1
            if "solver" in messages[0]["content"].lower() or "solver" in messages[1]["content"].lower():
                return solver_json
            return valid_batch_json

    llm = AlternatingMockLLM()
    config = QbConfig(max_calls_per_run=5, batch_size=2, auto_approve=True, out_of_level_threshold=1.0)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)


    summary = generator.generate(level=1, part_type="fill_blank", count=1, use_solver=True)
    assert summary.questions_saved == 1
    assert summary.batches_failed == 0
    assert summary.approved_count == 1

    # Verify saved question in store
    saved_qs = test_store.get_questions_by_level(1)
    assert len(saved_qs) == 1
    assert saved_qs[0].stem == "今天天气很好，我想去____借两本书。"
    assert saved_qs[0].status == "approved"


def test_generator_max_calls_enforcement(test_store, test_syllabus):
    # Set max_calls_per_run = 1
    config = QbConfig(max_calls_per_run=1, batch_size=1)
    llm = QbMockLLM()
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    # Request 5 questions
    summary = generator.generate(level=1, count=5, use_solver=False)
    # Generator should stop immediately after 1 call
    assert summary.calls_made == 1
    assert summary.stopped_reason is not None
    assert "Đạt giới hạn số lượt gọi" in summary.stopped_reason


def test_generator_safe_json_skips_malformed_batch(test_store, test_syllabus):
    # First call returns invalid JSON, second call returns valid JSON
    responses = [
        "THIS IS NOT VALID JSON AT ALL { malformed ...",
        json.dumps({
            "questions": [
                {
                    "stem": "王老师正在____给学生讲课。",
                    "options": ["教室", "操场", "食堂", "宿舍"],
                    "answer_index": 0,
                    "explanation_vi": "Trong ngữ cảnh giảng bài thì '教室' (phòng học) là thích hợp nhất.",
                    "topic": "school",
                    "vocab_tags": ["教室", "学生"]
                }
            ]
        })
    ]

    class SequentialMockLLM(QbMockLLM):
        def __init__(self):
            super().__init__()
            self.idx = 0

        def generate_chat_completion(self, messages, **kwargs):
            self.calls_count += 1
            res = responses[self.idx % len(responses)]
            self.idx += 1
            return res

    llm = SequentialMockLLM()
    config = QbConfig(max_calls_per_run=5, batch_size=1)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    summary = generator.generate(level=1, part_type="fill_blank", count=1, use_solver=False)
    assert summary.batches_failed == 1
    assert summary.questions_saved == 1


def test_generator_solver_mismatch_flags_needs_review(test_store, test_syllabus):
    valid_batch_json = json.dumps({
        "questions": [
            {
                "stem": "今天天气很好，我想去____借两本书。",
                "options": ["学校", "老师", "朋友", "准备"],
                "answer_index": 0,  # intended: 0 (学校)
                "explanation_vi": "Ngữ cảnh mượn sách.",
                "topic": "daily_life",
                "vocab_tags": ["学校"]
            }
        ]
    })

    # Solver answers with multiple or mismatched options
    solver_mismatch_json = json.dumps({
        "evaluations": [
            {
                "index": 0,
                "acceptable_options": [2],
                "analysis": {"2": "Solver preferred 朋友"}
            }
        ]
    })

    class MismatchMockLLM(QbMockLLM):
        def generate_chat_completion(self, messages, **kwargs):
            self.calls_count += 1
            if "solver" in messages[0]["content"].lower() or "solver" in messages[1]["content"].lower():
                return solver_mismatch_json
            return valid_batch_json

    llm = MismatchMockLLM()
    config = QbConfig(max_calls_per_run=5, batch_size=1, auto_approve=True)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    summary = generator.generate(level=1, part_type="fill_blank", count=1, use_solver=True)
    assert summary.questions_saved == 1
    assert summary.needs_review_count == 1
    assert summary.approved_count == 0

    saved_qs = test_store.get_questions_by_level(1)
    assert saved_qs[0].status == "needs_review"
    assert any("Solver mismatch" in note for note in saved_qs[0].qa.notes)


def test_generator_rejects_out_of_range_level(test_store, test_syllabus):
    generator = QbGenerator(syllabus=test_syllabus, store=test_store)
    with pytest.raises(ValueError, match="Level 0 không được hỗ trợ"):
        generator.generate(level=0)

    with pytest.raises(ValueError, match="Level 7 không được hỗ trợ"):
        generator.generate(level=7)


def test_generator_duplicate_hash_does_not_stop_batch(test_store, test_syllabus, sample_question):
    # Save an initial fill-blank question in test_store
    existing_stem = "今天天气很好，我们一起去学校____吧。"
    existing_opts = ["看书", "买菜", "睡觉", "游泳"]
    h_existing = QbQuestion.compute_hash(existing_stem, existing_opts, 0)
    q_existing = sample_question.model_copy(update={
        "question_id": "qb_existing_001",
        "stem": existing_stem,
        "options": existing_opts,
        "answer_index": 0,
        "content_hash": h_existing
    })
    test_store.save_question(q_existing)

    # Batch contains 2 questions:
    # Question 1: exact duplicate of q_existing (same stem, options, answer_index -> duplicate hash)
    # Question 2: a brand new distinct question
    batch_with_duplicate = json.dumps({
        "questions": [
            {
                "stem": existing_stem,
                "options": existing_opts,
                "answer_index": 0,
                "explanation_vi": "Giải thích câu trùng lặp.",
                "topic": "school",
                "vocab_tags": ["学校"]
            },
            {
                "stem": "我是这里的学生，今天第一天来____。",
                "options": ["学校", "老师", "朋友", "准备"],
                "answer_index": 0,
                "explanation_vi": "Trong ngữ cảnh học sinh đến học thì '学校' là nơi chốn chính xác.",
                "topic": "school",
                "vocab_tags": ["学生", "学校"]
            }
        ]
    })

    llm = QbMockLLM(predefined_response=batch_with_duplicate)
    # 1 run with batch_size=2
    config = QbConfig(max_calls_per_run=1, batch_size=2, out_of_level_threshold=1.0)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    summary = generator.generate(level=1, part_type="fill_blank", count=2, use_solver=False)

    # Question 1 was detected as duplicate, Question 2 was successfully saved without stopping batch
    assert summary.duplicate_count == 1
    assert summary.questions_saved == 1
    assert summary.batches_failed == 0


def test_generator_solver_ambiguity_two_acceptable_flags_needs_review(test_store, test_syllabus):
    # Prompt: 我喜欢在家里____书 (看/听/写/说)
    # Expected target answer: 0 (看)
    # Solver evaluates both 看 (0) and 写 (2) as acceptable -> ambiguity -> needs_review
    ambiguous_q_json = json.dumps({
        "questions": [
            {
                "stem": "我喜欢在家里____书。",
                "options": ["看", "听", "写", "说"],
                "answer_index": 0,
                "explanation_vi": "Trong ngữ cảnh đọc sách ở nhà.",
                "topic": "hobby",
                "vocab_tags": ["看", "书"]
            }
        ]
    })

    # Solver evaluation returns [0, 2] as acceptable
    solver_eval_ambiguous = json.dumps({
        "evaluations": [
            {
                "index": 0,
                "acceptable_options": [0, 2],
                "analysis": {
                    "0": "看书 (đọc sách) rất tự nhiên",
                    "1": "听书 (nghe sách nói) không thông dụng ở HSK 1",
                    "2": "写书 (viết sách) cũng đúng ngữ pháp",
                    "3": "说书 (kể chuyện) không phù hợp"
                }
            }
        ]
    })

    class AmbiguityMockLLM(QbMockLLM):
        def generate_chat_completion(self, messages, **kwargs):
            self.calls_count += 1
            if "solver" in messages[0]["content"].lower() or "solver" in messages[1]["content"].lower():
                return solver_eval_ambiguous
            return ambiguous_q_json

    llm = AmbiguityMockLLM()
    config = QbConfig(max_calls_per_run=5, batch_size=1, auto_approve=True)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    summary = generator.generate(level=1, part_type="fill_blank", count=1, use_solver=True)
    assert summary.questions_saved == 1
    assert summary.needs_review_count == 1
    assert summary.approved_count == 0

    saved_qs = test_store.get_questions_by_level(1)
    assert saved_qs[0].status == "needs_review"
    assert any("Solver flagged ambiguity" in note for note in saved_qs[0].qa.notes)


def test_generator_rejects_end_to_end_noise_and_does_not_save_to_db(test_store, test_syllabus):
    # Batch returns 1 noisy question (with Latin 'needle') and 1 valid clean question
    batch_json = json.dumps({
        "questions": [
            {
                "stem": "今天天气很热，我想____水 needle。",
                "options": ["喝", "吃", "看", "听"],
                "answer_index": 0,
                "explanation_vi": "Uống nước khi trời nóng.",
                "topic": "daily_life",
                "vocab_tags": ["喝"]
            },
            {
                "stem": "今天天气很热，我想____水。",
                "options": ["喝", "吃", "看", "听"],
                "answer_index": 0,
                "explanation_vi": "Uống nước khi trời nóng.",
                "topic": "daily_life",
                "vocab_tags": ["喝"]
            }
        ]
    })

    llm = QbMockLLM(predefined_response=batch_json)
    config = QbConfig(max_calls_per_run=2, batch_size=2, out_of_level_threshold=1.0)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    summary = generator.generate(level=1, part_type="fill_blank", count=1, use_solver=False)
    # The first question with 'needle' must be rejected and not saved to DB
    assert summary.rejected_validation_count == 1
    assert summary.rejected_by_reason.get("chữ_nhiễu") == 1
    assert summary.questions_saved == 1

    saved = test_store.get_questions_by_level(1)
    assert len(saved) == 1
    assert "needle" not in saved[0].stem


def test_vocab_tags_excludes_distractors(test_store, test_syllabus):
    batch_json = json.dumps({
        "questions": [
            {
                "stem": "王老师正在____给学生讲课。",
                "options": ["学校", "老师", "学生", "朋友"],
                "answer_index": 0,
                "explanation_vi": "Giải thích ngữ cảnh.",
                "topic": "school",
                "vocab_tags": ["学校", "老师", "学生", "朋友"]  # LLM mistakenly passed distractors as tags
            }
        ]
    })

    llm = QbMockLLM(predefined_response=batch_json)
    config = QbConfig(max_calls_per_run=1, batch_size=1, out_of_level_threshold=1.0)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    summary = generator.generate(level=1, part_type="fill_blank", count=1, use_solver=False)
    assert summary.questions_saved == 1

    saved = test_store.get_questions_by_level(1)[0]
    # Distractors ("老师", "学生", "朋友") MUST NOT be in vocab_tags
    assert "学校" in saved.vocab_tags
    assert "老师" not in saved.vocab_tags
    assert "学生" not in saved.vocab_tags
    assert "朋友" not in saved.vocab_tags


def test_generator_vocab_rotation_prioritizes_unused_and_handles_exhaustion(test_store, test_syllabus):
    # test_syllabus level 1 has: 学校, 老师, 学生, 朋友
    # We simulate a question already saved in store testing '学校'
    from qbank.models import QbQuestion, QbProvenance, QbQA
    h = QbQuestion.compute_hash("我的好朋友去____上课。", ["学校", "医院", "银行", "商店"], 0)
    q_used = QbQuestion(
        question_id="qb_1_used_001",
        level=1,
        skill="reading",
        part_type="fill_blank",
        stem="我的好朋友去____上课。",
        options=["学校", "医院", "银行", "商店"],
        answer_index=0,
        explanation_vi="Đi đến trường học.",
        vocab_tags=["学校"],
        status="approved",
        content_hash=h,
        provenance=QbProvenance(origin="original_generated", batch_id="b0", prompt_version="v1", llm_model="m", created_at="2026-01-01T00:00:00Z"),
        qa=QbQA(structure_ok=True, level_ok=True, notes=[])
    )
    test_store.save_question(q_used)

    captured_prompts = []

    class PromptCapturingLLM(QbMockLLM):
        def generate_chat_completion(self, messages, **kwargs):
            self.calls_count += 1
            captured_prompts.append(messages[1]["content"])
            return json.dumps({
                "questions": [
                    {
                        "stem": "王老师正在____给学生讲课。",
                        "options": ["教室", "操场", "食堂", "宿舍"],
                        "answer_index": 0,
                        "explanation_vi": "Giảng bài trong lớp.",
                        "topic": "school",
                        "vocab_tags": ["教室"]
                    }
                ]
            })

    llm = PromptCapturingLLM()
    config = QbConfig(max_calls_per_run=2, batch_size=1, out_of_level_threshold=1.0)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    generator.generate(level=1, part_type="fill_blank", count=1, use_solver=False)

    assert len(captured_prompts) == 1
    prompt_text = captured_prompts[0]
    # Unused words (老师, 学生, 朋友) should be prioritized in prompt, while used word (学校) is excluded
    assert "老师" in prompt_text or "学生" in prompt_text
    assert "学校" not in prompt_text


