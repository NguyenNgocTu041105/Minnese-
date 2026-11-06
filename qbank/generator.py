import os
import re
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field

from qbank.config import qbank_config, QbConfig, assert_free_only_provider
from qbank.models import QbQuestion, QbProvenance, QbQA
from qbank.llm import (
    QbLLMInterface,
    QbOpenAIClient,
    QbTruncatedOutput,
    QbLLMQuotaError,
    QbLLMError,
    QbLLMNetworkError,
    normalize_model_name
)
from qbank.syllabus import QbSyllabus, get_syllabus
from qbank.store import QbStore, get_store
from qbank.prompts import load_prompt_template
from qbank.validators import (
    validate_structure,
    validate_fill_blank,
    validate_level,
    validate_clean_characters,
    validate_character_level
)
from qbank.dedup import compute_content_hash, check_near_duplicate, get_comparable_stem


logger = logging.getLogger("qbank.generator")


class QbGenerationSummary(BaseModel):
    """Summary metrics of a generation run."""
    batch_id: str
    level: int
    part_type: str
    requested_count: int
    calls_made: int
    batches_attempted: int
    batches_failed: int
    questions_generated: int
    questions_saved: int
    approved_count: int
    needs_review_count: int
    rejected_validation_count: int
    duplicate_count: int
    rejected_by_reason: Dict[str, int] = Field(default_factory=dict)
    failure_counts_by_type: Dict[str, int] = Field(default_factory=dict)
    split_batch_count: int = 0
    fallback_count: int = 0
    models_used: Dict[str, int] = Field(default_factory=dict)
    token_usage_by_model: Dict[str, Dict[str, int]] = Field(default_factory=dict)
    is_dry_run: bool = False
    generated_questions: List[QbQuestion] = Field(default_factory=list)
    stopped_reason: Optional[str] = None



def extract_json_block(raw_text: str) -> str:
    """
    Safely extracts a JSON string from raw text by stripping markdown code fences
    (```json ... ``` or ``` ... ```) and trimming extraneous text.
    """
    text = raw_text.strip()

    # Pattern 1: Markdown fence
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if fence_match:
        text = fence_match.group(1).strip()

    # Pattern 2: Enclosed in { ... } or [ ... ]
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        return text[first_brace : last_brace + 1]

    first_bracket = text.find("[")
    last_bracket = text.rfind("]")
    if first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket:
        return text[first_bracket : last_bracket + 1]

    return text


class QbGenerator:
    """
    Generates original HSK 3.0 questions in batches matching blueprints.
    Enforces call limits, robust JSON parsing, multi-layer validation,
    near-duplicate checking, solver verification, and storage.
    """
    def __init__(
        self,
        llm: Optional[QbLLMInterface] = None,
        syllabus: Optional[QbSyllabus] = None,
        store: Optional[QbStore] = None,
        config: Optional[QbConfig] = None
    ):
        self.config = config or qbank_config
        self.llm = llm or QbOpenAIClient(fallback_models=self.config.fallback_models)
        self.syllabus = syllabus or get_syllabus()
        self.store = store or get_store()

    def _record_token_usage(self, summary: QbGenerationSummary, actual_model: str) -> None:
        usage = getattr(self.llm, "last_usage", {}) or {}
        p_tok = int(usage.get("prompt_tokens") or 0)
        c_tok = int(usage.get("completion_tokens") or 0)
        t_tok = int(usage.get("total_tokens") or (p_tok + c_tok))
        details = usage.get("completion_tokens_details") or {}
        r_tok = int(details.get("reasoning_tokens") or usage.get("reasoning_tokens") or 0)
        model_stats = summary.token_usage_by_model.setdefault(actual_model, {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "reasoning_tokens": 0,
            "total_tokens": 0,
        })
        model_stats["prompt_tokens"] += p_tok
        model_stats["completion_tokens"] += c_tok
        model_stats["reasoning_tokens"] += r_tok
        model_stats["total_tokens"] += t_tok
        r_str = f", reasoning={r_tok}" if r_tok else ""
        logger.info(f"API Token Usage ({actual_model}): prompt={p_tok}, completion={c_tok}{r_str}, total={t_tok}")

    def generate(
        self,
        level: int,
        part_type: str = "fill_blank",
        count: int = 5,
        use_solver: bool = True,
        batch_id: Optional[str] = None,
        dry_run: bool = False,
        skill: Optional[str] = None
    ) -> QbGenerationSummary:
        """
        Executes question generation for a specific HSK level.
        Enforces max_calls_per_run; handles JSON failures gracefully;
        runs optional solver check; saves questions to store (unless dry_run=True).
        """
        if level < 1 or level > 6:
            raise ValueError(f"Level {level} không được hỗ trợ. QBank chỉ hỗ trợ HSK 1 đến 6.")

        if isinstance(self.llm, QbOpenAIClient):
            assert_free_only_provider(self.llm.base_url)

        valid_skills = {"listening", "reading", "writing", "speaking", "vocabulary", "grammar"}
        if skill:
            s_clean = skill.strip().lower()
            if s_clean not in valid_skills:
                raise ValueError(f"Skill '{skill}' không hợp lệ. Phải là một trong: {valid_skills}")
            effective_skill = s_clean
        else:
            p_lower = part_type.lower()
            if p_lower.startswith("listen"):
                effective_skill = "listening"
            elif p_lower.startswith("write"):
                effective_skill = "writing"
            elif p_lower.startswith("speak"):
                effective_skill = "speaking"
            else:
                effective_skill = "reading"

        active_batch_id = batch_id or f"batch_{level}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"

        summary = QbGenerationSummary(
            batch_id=active_batch_id,
            level=level,
            part_type=part_type,
            requested_count=count,
            calls_made=0,
            batches_attempted=0,
            batches_failed=0,
            questions_generated=0,
            questions_saved=0,
            approved_count=0,
            needs_review_count=0,
            rejected_validation_count=0,
            duplicate_count=0,
            is_dry_run=dry_run
        )

        max_calls = self.config.max_calls_per_run
        batch_size = self.config.batch_size
        remaining = count

        # Load existing stems, option sets, and used vocab_tags for rotation and near-duplicate checking
        existing_stems: List[str] = []
        used_vocab_words: Set[str] = set()
        existing_option_sets = self.store.get_existing_option_sets(level)
        batch_option_sets: Set[frozenset] = set()

        with self.store.session() as conn:
            cur = conn.cursor()
            cur.execute("SELECT stem, vocab_tags FROM qb_questions WHERE level = ?;", (level,))
            for r in cur.fetchall():
                existing_stems.append(r["stem"])
                if r["vocab_tags"]:
                    try:
                        tags = json.loads(r["vocab_tags"]) if isinstance(r["vocab_tags"], str) else r["vocab_tags"]
                        used_vocab_words.update(tags)
                    except Exception:
                        pass

        # Select prompt template
        if part_type in ("fill_blank", "reading_part1"):
            template_name = "reading_fill_blank"
        else:
            template_name = "reading_comprehension"
        template_text = load_prompt_template(template_name)

        # Allowed characters list for strict level compliance
        allowed_chars = self.syllabus.get_chars_up_to_level(level)
        allowed_chars_str = " ".join(allowed_chars)

        # Build vocabulary pool for target level (ordered by syllabus)
        level_vocab_items = self.syllabus.get_vocab_for_level(level)
        all_vocab_words = [v.word for v in level_vocab_items]
        # Prioritize words not yet tested in DB, then fallback to full list
        unused_vocab = [w for w in all_vocab_words if w not in used_vocab_words]
        vocab_pool = unused_vocab if unused_vocab else all_vocab_words

        # Initialize random generator for target vocabulary sampling
        # If QBANK_SAMPLING_SEED is set, sampling is reproducible; otherwise random each run
        import random
        seed_val = getattr(self.config, "sampling_seed", None)
        rng = random.Random(seed_val) if seed_val is not None else random.Random()
        shuffled_vocab_pool = list(vocab_pool)
        rng.shuffle(shuffled_vocab_pool)

        # Pre-flight DNS resolution check for real LLM client
        if isinstance(self.llm, QbOpenAIClient) and not getattr(self.config, "_skip_dns_check", False):
            from urllib.parse import urlparse
            import socket
            parsed_url = urlparse(self.config.llm_base_url)
            host = parsed_url.hostname or "generativelanguage.googleapis.com"
            try:
                socket.getaddrinfo(host, 443)
            except Exception as dns_err:
                msg = (
                    f"Không thể phân giải DNS cho máy chủ LLM ({host}): {dns_err}. "
                    "Vui lòng kiểm tra kết nối mạng, DNS (đổi sang 8.8.8.8 hoặc 1.1.1.1), VPN hoặc proxy."
                )
                logger.error(msg)
                raise QbLLMNetworkError(msg)

        vocab_rotation_idx = 0
        consecutive_network_failures = 0
        pending_batches: List[Tuple[int, int]] = [(min(remaining, batch_size), 0)]

        while remaining > 0 and pending_batches:
            # Check call quota
            if summary.calls_made >= max_calls:
                summary.stopped_reason = f"Đạt giới hạn số lượt gọi LLM tối đa (max_calls_per_run={max_calls})."
                logger.warning(summary.stopped_reason)
                break

            # Requirement 5: 3 lô liên tiếp lỗi mạng thì dừng
            if consecutive_network_failures >= 3:
                summary.stopped_reason = "Dừng sớm: 3 lô liên tiếp gặp lỗi kết nối mạng."
                logger.error(summary.stopped_reason)
                break

            # Requirement 5: Tổng số lô lỗi đạt ngưỡng max_failures_per_run thì dừng
            if summary.batches_failed >= self.config.max_failures_per_run:
                summary.stopped_reason = f"Dừng sớm: Tổng số lô lỗi đạt ngưỡng tối đa (max_failures_per_run={self.config.max_failures_per_run})."
                logger.error(summary.stopped_reason)
                break

            current_batch_count, split_depth = pending_batches.pop(0)
            summary.batches_attempted += 1

            # Select target vocabulary words (1 target word per question) from shuffled pool
            if shuffled_vocab_pool:
                # Feature F12: If available pool has fewer unique words than current_batch_count,
                # backfill from all_vocab_words to prevent repeating the exact same word within a single batch
                batch_pool = list(shuffled_vocab_pool)
                if len(batch_pool) < current_batch_count:
                    backfill_candidates = [w for w in all_vocab_words if w not in batch_pool]
                    rng.shuffle(backfill_candidates)
                    batch_pool.extend(backfill_candidates)

                target_vocab_subset: List[str] = []
                for _ in range(current_batch_count):
                    word = batch_pool[vocab_rotation_idx % len(batch_pool)]
                    if word in target_vocab_subset and len(target_vocab_subset) < len(batch_pool):
                        candidates = [w for w in batch_pool if w not in target_vocab_subset]
                        if candidates:
                            word = candidates[0]
                    target_vocab_subset.append(word)
                    vocab_rotation_idx += 1
                vocab_sample = ", ".join(target_vocab_subset)
            else:
                vocab_sample = "常用词汇"

            prompt_content = (
                template_text
                .replace("{level}", str(level))
                .replace("{batch_size}", str(current_batch_count))
                .replace("{vocab_list}", vocab_sample)
                .replace("{allowed_chars_list}", allowed_chars_str)
            )

            # 1. Call LLM for generation
            try:
                raw_response = self.llm.generate_chat_completion(
                    messages=[
                        {"role": "system", "content": "You are a professional Chinese language exam item writer."},
                        {"role": "user", "content": prompt_content}
                    ],
                    temperature=self.config.llm_temperature,
                    max_tokens=self.config.llm_max_tokens
                )
                # Success response received from server
                summary.calls_made += 1
                consecutive_network_failures = 0
                actual_model = getattr(self.llm, "active_model", getattr(self.llm, "model", "mock-llm")) or "mock-llm"
                self._record_token_usage(summary, actual_model)
                if normalize_model_name(actual_model) != normalize_model_name(self.config.llm_model) and actual_model != "mock-llm":
                    summary.fallback_count += 1
            except QbTruncatedOutput as trunc_err:
                # Output truncated: DO NOT fallback model. Split batch in half (max 2 levels)
                summary.calls_made += 1
                consecutive_network_failures = 0
                summary.failure_counts_by_type["cắt_cụt_tokens"] = summary.failure_counts_by_type.get("cắt_cụt_tokens", 0) + 1
                if current_batch_count > 1 and split_depth < 2:
                    summary.split_batch_count += 1
                    h1 = current_batch_count // 2
                    h2 = current_batch_count - h1
                    logger.warning(
                        f"Lô {current_batch_count} câu bị cắt cụt do giới hạn token. "
                        f"Chia đôi lô thành 2 lô nhỏ hơn ({h1}, {h2}) (cấp chia {split_depth + 1}/2)..."
                    )
                    pending_batches.insert(0, (h2, split_depth + 1))
                    pending_batches.insert(0, (h1, split_depth + 1))
                    continue
                else:
                    logger.warning(
                        f"Lô {current_batch_count} câu bị cắt cụt và không thể chia nhỏ hơn nữa (cấp chia {split_depth}). Bỏ qua."
                    )
                    summary.batches_failed += 1
                    if remaining > 0 and not pending_batches:
                        pending_batches.append((min(remaining, batch_size), 0))
                    continue
            except QbLLMNetworkError as net_err:
                # Network error: DO NOT increment calls_made (server never responded)
                consecutive_network_failures += 1
                summary.batches_failed += 1
                summary.failure_counts_by_type["lỗi_mạng"] = summary.failure_counts_by_type.get("lỗi_mạng", 0) + 1
                logger.error(f"Lỗi mạng khi gọi LLM ở lô {summary.batches_attempted} ({consecutive_network_failures}/3 liên tiếp): {net_err}")
                if remaining > 0 and not pending_batches:
                    pending_batches.append((min(remaining, batch_size), 0))
                continue
            except QbLLMQuotaError as quota_err:
                summary.calls_made += 1
                consecutive_network_failures = 0
                summary.failure_counts_by_type["hết_quota_429"] = summary.failure_counts_by_type.get("hết_quota_429", 0) + 1
                summary.stopped_reason = f"Hết quota LLM: {str(quota_err)}"
                logger.error(summary.stopped_reason)
                break
            except Exception as gen_err:
                summary.calls_made += 1
                consecutive_network_failures = 0
                err_str = str(gen_err)
                if "503" in err_str:
                    summary.failure_counts_by_type["quá_tải_503"] = summary.failure_counts_by_type.get("quá_tải_503", 0) + 1
                else:
                    summary.failure_counts_by_type["lỗi_khác"] = summary.failure_counts_by_type.get("lỗi_khác", 0) + 1
                logger.error(f"Lỗi khi gọi LLM sinh câu hỏi cho lô {summary.batches_attempted}: {gen_err}")
                summary.batches_failed += 1
                if remaining > 0 and not pending_batches:
                    pending_batches.append((min(remaining, batch_size), 0))
                continue

            # 2. Safe JSON Parsing
            try:
                cleaned_json = extract_json_block(raw_response)
                parsed_data = json.loads(cleaned_json)
                if isinstance(parsed_data, dict):
                    raw_questions = parsed_data.get("questions", [])
                elif isinstance(parsed_data, list):
                    raw_questions = parsed_data
                else:
                    raw_questions = []

                if not raw_questions:
                    logger.warning(f"Lô {summary.batches_attempted} trả về dữ liệu rỗng. Bỏ qua lô này.")
                    summary.batches_failed += 1
                    if remaining > 0 and not pending_batches:
                        pending_batches.append((min(remaining, batch_size), 0))
                    continue
            except Exception as parse_err:
                logger.warning(
                    f"Không thể parse JSON từ phản hồi LLM ở lô {summary.batches_attempted}: {parse_err}. "
                    "Bỏ qua lô này và tiếp tục lần chạy."
                )
                summary.batches_failed += 1
                summary.rejected_by_reason["parse_lỗi"] = summary.rejected_by_reason.get("parse_lỗi", 0) + 1
                if remaining > 0 and not pending_batches:
                    pending_batches.append((min(remaining, batch_size), 0))
                continue

            batch_valid_questions: List[QbQuestion] = []

            # 3. Validation & Model Construction
            for raw_q in raw_questions:
                summary.questions_generated += 1
                stem = raw_q.get("stem", "")
                passage = raw_q.get("passage")
                options = raw_q.get("options", [])
                answer_index = raw_q.get("answer_index", 0)
                explanation_vi = raw_q.get("explanation_vi", "")
                topic = raw_q.get("topic", "")
                vocab_tags = raw_q.get("vocab_tags", [])

                # Feature F8: Strip common LLM letter/numeric prefixes from options (e.g. "A. 苹果", "1. 苹果" -> "苹果")
                cleaned_options = []
                for opt in options:
                    opt_str = str(opt).strip()
                    cleaned_opt = re.sub(r"^(?:\([A-Ha-h0-9]\)|（[A-Ha-h0-9]）|[A-Ha-h0-9][\.\、\:\s])\s*", "", opt_str).strip()
                    cleaned_options.append(cleaned_opt if cleaned_opt else opt_str)
                options = cleaned_options

                # Configurable expected_options based on part_type
                if part_type == "true_false":
                    expected_opts = 2
                elif part_type == "matching":
                    expected_opts = 5
                elif "_3opt" in part_type or part_type.endswith("3opt"):
                    expected_opts = 3 if len(options) == 3 else None
                elif "_6opt" in part_type or part_type.endswith("6opt") or "split" in part_type:
                    expected_opts = 6 if len(options) == 6 else None
                elif "_2opt" in part_type or part_type.endswith("2opt"):
                    expected_opts = 2 if len(options) == 2 else None
                elif "_5opt" in part_type or part_type.endswith("5opt") or "ordering" in part_type:
                    expected_opts = 5 if len(options) == 5 else None
                elif "_4opt" in part_type or part_type.endswith("4opt"):
                    expected_opts = 4 if len(options) == 4 else None
                elif "write" in part_type:
                    expected_opts = None
                else:
                    expected_opts = 4

                # A. Structure Validation
                struct_ok, struct_notes = validate_structure(
                    stem, options, answer_index, explanation_vi, expected_options=expected_opts
                )

                # B. Clean Characters Validation (Hanzi, punctuation, blanks only; no Latin/Vi/bracket noise)
                char_ok, char_notes = validate_clean_characters(stem, options)

                # C. Fill-in-the-blank Validation (if applicable)
                fill_blank_ok = True
                fill_notes: List[str] = []
                if part_type in ("fill_blank", "reading_part1"):
                    fill_blank_ok, fill_notes = validate_fill_blank(stem, options, answer_index, level=level)

                # D. Vocabulary & Character Level Validation
                # Evaluated on filled stem (no distractor dilution) to accurately catch over-level characters
                filled_stem = stem
                if 0 <= answer_index < len(options):
                    ans_str = str(options[answer_index]).strip()
                    # Feature F7: Uniform blank replacement for 3+ underscores or bracket placeholders
                    if re.search(r"_{3,}|（\s*）|\(\s*\)", stem):
                        filled_stem = re.sub(r"_{3,}|（\s*）|\(\s*\)", ans_str, stem, count=1)
                    else:
                        filled_stem = f"{stem} {ans_str}"
                eval_stem_text = f"{passage or ''} {filled_stem}".strip()

                effective_char_budget = getattr(self.config, "char_budget", 0.05)
                if self.config.out_of_level_threshold >= 1.0:
                    effective_char_budget = self.config.out_of_level_threshold

                char_level_ok, char_details, char_level_notes = validate_character_level(
                    text=eval_stem_text,
                    target_level=level,
                    syllabus=self.syllabus,
                    char_budget=effective_char_budget
                )

                # Check each option individually with 0% budget (options cannot contain out-of-level characters)
                for opt_idx, opt in enumerate(options):
                    opt_ok, opt_details, opt_notes = validate_character_level(
                        text=str(opt),
                        target_level=level,
                        syllabus=self.syllabus,
                        char_budget=0.0
                    )
                    if not opt_ok:
                        char_level_ok = False
                        char_level_notes.append(
                            f"Phương án [{opt_idx}] '{opt}' chứa chữ vượt cấp: {opt_details.get('out_of_level_chars', [])}"
                        )

                word_level_ok, out_of_level_words, word_level_notes = validate_level(
                    text=eval_stem_text,
                    target_level=level,
                    syllabus=self.syllabus,
                    threshold=self.config.out_of_level_threshold
                )

                all_notes = struct_notes + char_notes + fill_notes + char_level_notes + word_level_notes

                # If critical structural, character noise, or fill-blank check failed -> reject immediately
                if not struct_ok or not char_ok or not fill_blank_ok:
                    summary.rejected_validation_count += 1
                    if not char_ok:
                        summary.rejected_by_reason["chữ_nhiễu"] = summary.rejected_by_reason.get("chữ_nhiễu", 0) + 1
                    if not struct_ok:
                        summary.rejected_by_reason["cấu_trúc"] = summary.rejected_by_reason.get("cấu_trúc", 0) + 1
                    if not fill_blank_ok:
                        summary.rejected_by_reason["fill_blank"] = summary.rejected_by_reason.get("fill_blank", 0) + 1
                    logger.info(f"Từ chối câu hỏi do vi phạm cấu trúc/ký tự/fill-blank: {all_notes}")
                    continue

                # D. Content Hash & Dedup
                c_hash = compute_content_hash(stem, options, answer_index)
                if self.store.get_question_by_hash(c_hash) is not None:
                    summary.duplicate_count += 1
                    summary.rejected_by_reason["trùng_hash"] = summary.rejected_by_reason.get("trùng_hash", 0) + 1
                    logger.info(f"Bỏ qua câu hỏi trùng lặp hoàn toàn (content_hash={c_hash[:8]}).")
                    continue

                # E. Near Duplicate Check (Adaptive n-gram & comparable filled stem for fill-blank)
                comp_stem = get_comparable_stem(stem, options, answer_index)
                is_near_dup, sim_score, matched = check_near_duplicate(
                    comp_stem,
                    existing_stems,
                    threshold=self.config.near_dup_threshold
                )
                if is_near_dup:
                    all_notes.append(f"Nghi vấn gần trùng lặp ({sim_score:.1%}) với câu có sẵn: '{matched}'")

                # F. Option Set Duplicate Check
                opt_set = frozenset(str(o).strip() for o in options)
                is_option_dup = False
                if opt_set in batch_option_sets:
                    is_option_dup = True
                    all_notes.append(f"Nghi vấn bộ lựa chọn trùng lặp với câu khác trong cùng đợt: {options}")
                elif opt_set in existing_option_sets:
                    is_option_dup = True
                    all_notes.append(f"Nghi vấn bộ lựa chọn trùng lặp với câu có sẵn trong kho ({existing_option_sets[opt_set]}): {options}")
                batch_option_sets.add(opt_set)

                actual_model = getattr(self.llm, "active_model", getattr(self.llm, "model", "mock-llm")) or "mock-llm"
                summary.models_used[actual_model] = summary.models_used.get(actual_model, 0) + 1
                is_fallback_model = (normalize_model_name(actual_model) != normalize_model_name(self.config.llm_model) and actual_model != "mock-llm")

                if is_fallback_model:
                    all_notes.append(f"Sinh bởi model dự phòng ({actual_model})")

                question_id = f"qb_{level}_{part_type}_{uuid.uuid4().hex[:8]}"
                qa_assessment = QbQA(
                    structure_ok=struct_ok,
                    level_ok=char_level_ok,
                    out_of_level_words=out_of_level_words,
                    notes=all_notes
                )

                provenance = QbProvenance(
                    origin="original_generated",
                    batch_id=active_batch_id,
                    prompt_version="v1.0",
                    llm_model=actual_model,
                    created_at=datetime.now(timezone.utc).isoformat()
                )

                # Determine initial status:
                # Character-level check gates status; fallback models or duplicate option sets force needs_review.
                # When use_solver=True, default initial status to "needs_review" until solver audits and approves.
                status = "needs_review"
                if not char_level_ok or is_near_dup or is_fallback_model or is_option_dup:
                    status = "needs_review"
                elif self.config.auto_approve and not use_solver:
                    status = "approved"

                # Determine real vocab tags: ONLY keep target/correct answer words and words from syllabus/prompt target list
                # Distractors (wrong options) are strictly excluded from vocab_tags
                real_tags = []
                if 0 <= answer_index < len(options):
                    ans_word = options[answer_index].strip()
                    if ans_word:
                        real_tags.append(ans_word)

                if isinstance(vocab_tags, list):
                    distractor_words = {
                        options[i].strip() for i in range(len(options)) if i != answer_index
                    }
                    for tag in vocab_tags:
                        t_clean = str(tag).strip()
                        # Only keep if not a distractor and not already in real_tags
                        if t_clean and t_clean not in distractor_words and t_clean not in real_tags:
                            real_tags.append(t_clean)

                qb_q = QbQuestion(
                    question_id=question_id,
                    level=level,
                    skill=effective_skill,
                    part_type=part_type,
                    stem=stem,
                    passage=passage,
                    options=options,
                    answer_index=answer_index,
                    explanation_vi=explanation_vi,
                    vocab_tags=real_tags,
                    topic=topic,
                    provenance=provenance,
                    qa=qa_assessment,
                    status=status,
                    content_hash=c_hash
                )
                batch_valid_questions.append(qb_q)

            # 4. Optional Solver Check
            if use_solver and batch_valid_questions:
                if summary.calls_made >= max_calls:
                    logger.warning("Đã đạt giới hạn số cuộc gọi. Bỏ qua solver check cho lô này.")
                    for q in batch_valid_questions:
                        q.status = "needs_review"
                        q.qa.notes.append("Solver check skipped: max_calls reached")
                else:
                    self._run_solver_check(batch_valid_questions, summary)

            # 5. Persist to store (or collect without saving if dry_run)
            for q in batch_valid_questions:
                summary.generated_questions.append(q)
                if dry_run:
                    summary.questions_saved += 1
                    existing_stems.append(q.stem)
                    remaining -= 1
                    if q.status == "approved":
                        summary.approved_count += 1
                    else:
                        summary.needs_review_count += 1
                else:
                    if self.store.save_question(q):
                        summary.questions_saved += 1
                        existing_stems.append(q.stem)
                        remaining -= 1
                        if q.status == "approved":
                            summary.approved_count += 1
                        else:
                            summary.needs_review_count += 1
                    else:
                        summary.duplicate_count += 1

            if remaining > 0 and not pending_batches:
                pending_batches.append((min(remaining, batch_size), 0))

        return summary


    def _run_solver_check(self, questions: List[QbQuestion], summary: QbGenerationSummary) -> None:
        """
        Runs a single batch solver verification call with answers stripped.
        If solver picks a different answer, question status is set to needs_review.
        """
        solver_template = load_prompt_template("solver_check")
        questions_payload = []
        for idx, q in enumerate(questions):
            payload_item = {
                "index": idx,
                "stem": q.stem,
                "passage": q.passage,
                "options": q.options
            }
            questions_payload.append(payload_item)

        solver_prompt = solver_template.replace(
            "{questions_payload}",
            json.dumps(questions_payload, ensure_ascii=False, indent=2)
        )


        try:
            summary.calls_made += 1
            raw_solver_res = self.llm.generate_chat_completion(
                messages=[
                    {"role": "system", "content": "You are an expert exam item auditor. Return pure JSON."},
                    {"role": "user", "content": solver_prompt}
                ],
                temperature=0.1,
                max_tokens=self.config.llm_max_tokens
            )
            solver_model = getattr(self.llm, "active_model", getattr(self.llm, "model", "mock-llm")) or "mock-llm"
            self._record_token_usage(summary, solver_model)
            cleaned = extract_json_block(raw_solver_res)
            parsed = json.loads(cleaned)
            evals_list = parsed.get("evaluations", []) if isinstance(parsed, dict) else []
            solver_evals = {}
            for item in evals_list:
                if isinstance(item, dict) and "index" in item:
                    try:
                        idx_val = int(str(item["index"]).strip())
                        solver_evals[idx_val] = item
                    except (ValueError, TypeError):
                        pass

            letter_map = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4, "F": 5, "G": 6, "H": 7}

            for idx, q in enumerate(questions):
                eval_item = solver_evals.get(idx)
                if eval_item is not None:
                    raw_acceptable = eval_item.get("acceptable_options", [])
                    # Feature F11: Normalize indices to ints, handling both integers and letters ("A"->0, etc.)
                    acceptable_opts = []
                    for o in raw_acceptable:
                        clean_o = re.sub(r"[\(\)\[\]\.\s]", "", str(o)).strip().upper()
                        if clean_o in letter_map:
                            acceptable_opts.append(letter_map[clean_o])
                        else:
                            try:
                                acceptable_opts.append(int(clean_o))
                            except (ValueError, TypeError):
                                pass

                    analysis_dict = eval_item.get("analysis", {})

                    if len(acceptable_opts) != 1:
                        q.status = "needs_review"
                        q.qa.notes.append(
                            f"Solver flagged ambiguity: {len(acceptable_opts)} options acceptable {acceptable_opts} (expected exactly 1). Details: {analysis_dict}"
                        )
                    elif acceptable_opts[0] != q.answer_index:
                        q.status = "needs_review"
                        q.qa.notes.append(
                            f"Solver mismatch: Option {acceptable_opts[0]} accepted vs target {q.answer_index}. Details: {analysis_dict}"
                        )
                    else:
                        # Exactly 1 option acceptable and matches expected answer
                        # Feature F9: Solver auto-approval must NEVER overwrite near-duplicate, option-duplicate, or fallback warnings
                        is_dup = any("trùng lặp" in n for n in q.qa.notes)
                        is_fallback = any("Sinh bởi model dự phòng" in n for n in q.qa.notes)
                        if q.qa.structure_ok and q.qa.level_ok and self.config.auto_approve and not is_dup and not is_fallback:
                            q.status = "approved"
                        else:
                            q.status = "needs_review"
                else:
                    q.status = "needs_review"
                    q.qa.notes.append("Solver response missing for this question index.")
        except Exception as e:
            logger.warning(f"Lỗi khi chạy solver check: {e}. Giữ trạng thái needs_review cho cả lô.")
            for q in questions:
                q.status = "needs_review"
                q.qa.notes.append(f"Solver check failed due to error: {e}")

    def generate_section(
        self,
        level: int,
        section: str,
        count_per_part: Optional[int] = None,
        use_solver: bool = True,
        batch_id: Optional[str] = None,
        dry_run: bool = False,
        skill: Optional[str] = None
    ) -> List[QbGenerationSummary]:
        """
        Generates questions section-by-section according to the official HSK blueprint.
        Iterates over all parts defined in the section, executing generation for each part.

        Args:
            level: HSK level (1 to 6)
            section: Section key (e.g. 'listening', 'reading', 'writing')
            count_per_part: Optional override for questions per part (if None, uses blueprint part.n_questions)
            use_solver: Whether to run solver verification
            batch_id: Optional batch ID prefix
            dry_run: If True, do not save to database
            skill: Optional skill override

        Returns:
            List[QbGenerationSummary] for each generated part
        """
        from qbank.blueprint import get_section_blueprint

        sec_bp = get_section_blueprint(level, section)
        sec_skill = skill or getattr(sec_bp, "skill", None) or section.lower()
        if sec_skill not in {"listening", "reading", "writing", "speaking", "vocabulary", "grammar"}:
            sec_skill = "reading"

        base_batch = batch_id or f"batch_{level}_{section}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"

        summaries: List[QbGenerationSummary] = []
        for part_key, part_spec in sec_bp.parts.items():
            n_q = count_per_part if (count_per_part is not None and count_per_part > 0) else part_spec.n_questions
            part_skill = getattr(part_spec, "skill", None) or sec_skill
            part_batch_id = f"{base_batch}_{part_key}"

            logger.info(
                f"Generating section '{section}' part '{part_key}': type={part_spec.type}, count={n_q}, skill={part_skill}"
            )

            summary = self.generate(
                level=level,
                part_type=part_spec.type,
                count=n_q,
                use_solver=use_solver,
                batch_id=part_batch_id,
                dry_run=dry_run,
                skill=part_skill
            )
            summaries.append(summary)

        return summaries
