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
    config = QbConfig(max_calls_per_run=2, batch_size=1, out_of_level_threshold=1.0, sampling_seed=42)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    generator.generate(level=1, part_type="fill_blank", count=1, use_solver=False)

    assert len(captured_prompts) == 1
    prompt_text = captured_prompts[0]
    # Unused words (老师, 学生, 朋友) should be prioritized in prompt, while used word (学校) is excluded
    assert any(w in prompt_text for w in ["老师", "学生", "朋友"])
    assert "学校" not in prompt_text


def test_generator_batch_splitting_on_truncated_output(test_store, test_syllabus):
    """Rule 1: If batch truncated, split batch in half and retry without model fallback."""
    from qbank.llm import QbTruncatedOutput

    call_sizes = []

    class TruncatingOnLargeBatchLLM(QbMockLLM):
        def generate_chat_completion(self, messages, **kwargs):
            self.calls_count += 1
            # Extract batch_size from prompt
            content = messages[1]["content"]
            import re
            m = re.search(r"Tạo (\d+) câu hỏi", content)
            requested = int(m.group(1)) if m else 4
            call_sizes.append(requested)

            if requested > 2:
                # Truncate large batch
                raise QbTruncatedOutput("Truncated!")

            # Small batches succeed
            return json.dumps({
                "questions": [
                    {
                        "stem": f"小李去学校____借书{self.calls_count}_{i}。",
                        "options": ["学习", "看书", "写字", "唱歌"],
                        "answer_index": 0,
                        "explanation_vi": "Giải thích ngắn gọn 1.",
                        "topic": "school",
                        "vocab_tags": ["学校"]
                    } for i in range(requested)
                ]
            })

    llm = TruncatingOnLargeBatchLLM()
    config = QbConfig(max_calls_per_run=10, batch_size=4, out_of_level_threshold=1.0)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    summary = generator.generate(level=1, part_type="fill_blank", count=4, use_solver=False)

    # Batch of 4 failed -> split into two batches of 2 -> both succeeded
    assert summary.split_batch_count == 1
    assert summary.failure_counts_by_type.get("cắt_cụt_tokens") == 1
    assert summary.questions_saved == 4
    assert call_sizes == [4, 2, 2]


def test_generator_fallback_model_tags_questions_and_forces_needs_review(test_store, test_syllabus):
    """Rule 3: Questions generated by fallback model must have llm_model set and forced needs_review."""
    class FallbackActiveLLM(QbMockLLM):
        active_model = "gemini-2.0-flash"

        def generate_chat_completion(self, messages, **kwargs):
            self.calls_count += 1
            return json.dumps({
                "questions": [
                    {
                        "stem": "今天天气很好，我想去____。",
                        "options": ["学校", "看书", "写字", "唱歌"],
                        "answer_index": 0,
                        "explanation_vi": "Giải thích ngắn gọn.",
                        "topic": "daily",
                        "vocab_tags": ["学校"]
                    }
                ]
            })

    llm = FallbackActiveLLM()
    # config.llm_model is gemini-2.5-flash, but llm.active_model is gemini-2.0-flash (fallback)
    config = QbConfig(llm_model="gemini-2.5-flash", auto_approve=True, max_calls_per_run=2, batch_size=1, out_of_level_threshold=1.0)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    summary = generator.generate(level=1, part_type="fill_blank", count=1, use_solver=False)
    assert summary.questions_saved == 1
    assert summary.fallback_count == 1
    assert summary.models_used.get("gemini-2.0-flash") == 1

    saved_q = summary.generated_questions[0]
    assert saved_q.provenance.llm_model == "gemini-2.0-flash"
    assert saved_q.status == "needs_review"  # Even though auto_approve=True!
    assert any("Sinh bởi model dự phòng (gemini-2.0-flash)" in n for n in saved_q.qa.notes)


def test_generator_stops_on_three_consecutive_network_failures(test_store, test_syllabus):
    """Rule 5: 3 consecutive network failures stops generator without counting to max_calls."""
    from qbank.llm import QbLLMNetworkError

    class NetworkDroppingLLM(QbMockLLM):
        def generate_chat_completion(self, messages, **kwargs):
            raise QbLLMNetworkError("Connect timeout")

    llm = NetworkDroppingLLM()
    config = QbConfig(max_calls_per_run=10, batch_size=1)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    summary = generator.generate(level=1, part_type="fill_blank", count=5, use_solver=False)

    assert "3 lô liên tiếp gặp lỗi kết nối mạng" in (summary.stopped_reason or "")
    assert summary.calls_made == 0  # Unanswered network errors do not consume calls_made
    assert summary.failure_counts_by_type.get("lỗi_mạng") == 3


def test_generator_solver_does_not_approve_duplicate_flagged_questions(test_store, test_syllabus):
    """Feature F9: Solver check must not promote near-duplicate or option-duplicate questions to approved."""
    from qbank.models import QbProvenance, QbQA

    # Pre-populate an existing question in the store with options ["学校", "医院", "银行", "机场"]
    existing_q = QbQuestion(
        question_id="qb_1_existing_dup",
        level=1,
        skill="reading",
        part_type="fill_blank",
        stem="今天天气很好，我想去____借两本书。",
        options=["学校", "医院", "银行", "机场"],
        answer_index=0,
        explanation_vi="Mượn sách ở trường.",
        vocab_tags=["学校"],
        status="approved",
        content_hash=QbQuestion.compute_hash("今天天气很好，我想去____借两本书。", ["学校", "医院", "银行", "机场"], 0),
        provenance=QbProvenance(origin="original_generated", batch_id="b_init", prompt_version="v1", llm_model="m", created_at="2026-01-01T00:00:00Z"),
        qa=QbQA(structure_ok=True, level_ok=True, notes=[])
    )
    test_store.save_question(existing_q)

    # Generate a question with a different stem but identical option set -> option duplicate!
    gen_json = json.dumps({
        "questions": [
            {
                "stem": "王老师今天下午在____开会。",
                "options": ["学校", "医院", "银行", "机场"],
                "answer_index": 0,
                "explanation_vi": "Giải thích.",
                "topic": "school",
                "vocab_tags": ["学校"]
            }
        ]
    })

    # Solver enthusiastically approves option 0
    solver_json = json.dumps({
        "evaluations": [
            {
                "index": 0,
                "acceptable_options": [0],
                "analysis": {"0": "Hoàn toàn chính xác"}
            }
        ]
    })

    class AlternatingDupLLM(QbMockLLM):
        def generate_chat_completion(self, messages, **kwargs):
            self.calls_count += 1
            if "solver" in messages[0]["content"].lower() or "solver" in messages[1]["content"].lower():
                return solver_json
            return gen_json

    llm = AlternatingDupLLM()
    config = QbConfig(auto_approve=True, max_calls_per_run=5, batch_size=1, out_of_level_threshold=1.0)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    summary = generator.generate(level=1, part_type="fill_blank", count=1, use_solver=True)
    assert len(summary.generated_questions) == 1
    q = summary.generated_questions[0]
    # Even though solver agreed and auto_approve=True, option-duplicate flag MUST keep status as needs_review!
    assert q.status == "needs_review"
    assert any("trùng lặp" in n for n in q.qa.notes)


def test_generator_solver_robust_parsing_letters_and_string_indices(test_store, test_syllabus):
    """Feature F11: Solver parser handles string indices and letter option identifiers."""
    gen_json = json.dumps({
        "questions": [
            {
                "stem": "我想去____借两本书。",
                "options": ["学校", "医院", "银行", "商店"],
                "answer_index": 0,
                "explanation_vi": "Giải thích.",
                "topic": "school",
                "vocab_tags": ["学校"]
            }
        ]
    })

    # Solver returns string index "0" and letter options ["A"]
    solver_json = json.dumps({
        "evaluations": [
            {
                "index": "0",
                "acceptable_options": ["A"],
                "analysis": {"A": "Option A is correct"}
            }
        ]
    })

    class AlternatingLetterLLM(QbMockLLM):
        def generate_chat_completion(self, messages, **kwargs):
            self.calls_count += 1
            if "solver" in messages[0]["content"].lower() or "solver" in messages[1]["content"].lower():
                return solver_json
            return gen_json

    llm = AlternatingLetterLLM()
    config = QbConfig(auto_approve=True, max_calls_per_run=5, batch_size=1, out_of_level_threshold=1.0)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    summary = generator.generate(level=1, part_type="fill_blank", count=1, use_solver=True)
    assert len(summary.generated_questions) == 1
    q = summary.generated_questions[0]
    # Successfully parsed string "0" and letter "A" -> 0, matching answer_index=0!
    assert q.status == "approved"
    assert summary.approved_count == 1


def test_generator_solver_skipped_on_max_calls_keeps_needs_review(test_store, test_syllabus):
    """Feature F10: When max_calls reached before solver runs, question remains needs_review."""
    gen_json = json.dumps({
        "questions": [
            {
                "stem": "今天天气很好，我想去____看书。",
                "options": ["学校", "医院", "银行", "机场"],
                "answer_index": 0,
                "explanation_vi": "Giải thích.",
                "topic": "school",
                "vocab_tags": ["学校"]
            }
        ]
    })

    llm = QbMockLLM(predefined_response=gen_json)
    # max_calls_per_run = 1: generation takes 1 call, solver cannot be called
    config = QbConfig(auto_approve=True, max_calls_per_run=1, batch_size=1, out_of_level_threshold=1.0)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    summary = generator.generate(level=1, part_type="fill_blank", count=1, use_solver=True)
    assert len(summary.generated_questions) == 1
    q = summary.generated_questions[0]
    # Gated status: must remain needs_review since solver check was skipped
    assert q.status == "needs_review"
    assert any("Solver check skipped: max_calls reached" in n for n in q.qa.notes)


def test_generator_option_prefix_stripping(test_store, test_syllabus):
    """Feature F8: Strip common LLM prefixes from options (e.g. 'A. 苹果' -> '苹果')."""
    gen_json = json.dumps({
        "questions": [
            {
                "stem": "王老师在____上课。",
                "options": ["A. 学校", "B. 医院", "C. 银行", "D. 机场"],
                "answer_index": 0,
                "explanation_vi": "Giải thích.",
                "topic": "school",
                "vocab_tags": ["学校"]
            }
        ]
    })

    llm = QbMockLLM(predefined_response=gen_json)
    config = QbConfig(auto_approve=True, max_calls_per_run=2, batch_size=1, out_of_level_threshold=1.0)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    summary = generator.generate(level=1, part_type="fill_blank", count=1, use_solver=False)
    assert len(summary.generated_questions) == 1
    q = summary.generated_questions[0]
    # Options must have prefixes stripped and pass character validation
    assert q.options == ["学校", "医院", "银行", "机场"]
    assert q.qa.structure_ok is True
    assert q.status == "approved"


def test_generator_option_numeric_prefix_stripping(test_store, test_syllabus):
    """Strip numeric prefixes from options: '1. 苹果', '(2) 香蕉', '3、橙子'."""
    gen_json = json.dumps({
        "questions": [
            {
                "stem": "桌子上放着很多水果，我最想吃____。",
                "options": ["1. 苹果", "(2) 香蕉", "3、橙子", "4. 西瓜"],
                "answer_index": 0,
                "explanation_vi": "Giải thích.",
                "topic": "fruits",
                "vocab_tags": ["苹果"]
            }
        ]
    })

    llm = QbMockLLM(predefined_response=gen_json)
    config = QbConfig(auto_approve=True, max_calls_per_run=2, batch_size=1, out_of_level_threshold=1.0)
    generator = QbGenerator(llm=llm, syllabus=test_syllabus, store=test_store, config=config)

    summary = generator.generate(level=1, part_type="fill_blank", count=1, use_solver=False)
    assert len(summary.generated_questions) == 1
    q = summary.generated_questions[0]
    # Options must have numeric prefixes stripped cleanly
    assert q.options == ["苹果", "香蕉", "橙子", "西瓜"]
    assert q.qa.structure_ok is True
    assert q.status == "approved"


def test_generator_configurable_option_counts_true_false_and_matching(test_store, test_syllabus):
    """Support configurable option counts: 2 for true_false, 5 for matching."""
    # 1. true_false (2 options)
    tf_json = json.dumps({
        "questions": [
            {
                "stem": "他是中国人。",
                "options": ["对", "错"],
                "answer_index": 0,
                "explanation_vi": "Đúng.",
                "topic": "general",
                "vocab_tags": ["中国", "人"]
            }
        ]
    })
    llm_tf = QbMockLLM(predefined_response=tf_json)
    cfg_tf = QbConfig(auto_approve=True, max_calls_per_run=2, batch_size=1, out_of_level_threshold=1.0)
    gen_tf = QbGenerator(llm=llm_tf, syllabus=test_syllabus, store=test_store, config=cfg_tf)

    summary_tf = gen_tf.generate(level=1, part_type="true_false", count=1, use_solver=False)
    assert len(summary_tf.generated_questions) == 1
    q_tf = summary_tf.generated_questions[0]
    assert len(q_tf.options) == 2
    assert q_tf.qa.structure_ok is True

    # 2. matching (5 options)
    matching_json = json.dumps({
        "questions": [
            {
                "stem": "小明正在____里看书。",
                "options": ["学校", "医院", "银行", "商店", "机场"],
                "answer_index": 0,
                "explanation_vi": "Đọc sách ở trường.",
                "topic": "school",
                "vocab_tags": ["学校"]
            }
        ]
    })
    llm_match = QbMockLLM(predefined_response=matching_json)
    gen_match = QbGenerator(llm=llm_match, syllabus=test_syllabus, store=test_store, config=cfg_tf)

    summary_match = gen_match.generate(level=1, part_type="matching", count=1, use_solver=False)
    assert len(summary_match.generated_questions) == 1
    q_match = summary_match.generated_questions[0]
    assert len(q_match.options) == 5
    assert q_match.qa.structure_ok is True




