import os
import re
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field

from qbank.config import qbank_config, QbConfig
from qbank.models import QbQuestion, QbProvenance, QbQA
from qbank.llm import QbLLMInterface, QbOpenAIClient, QbTruncatedOutput, QbLLMQuotaError, QbLLMError
from qbank.syllabus import QbSyllabus, get_syllabus
from qbank.store import QbStore, get_store
from qbank.prompts import load_prompt_template
from qbank.validators import validate_structure, validate_fill_blank, validate_level, validate_clean_characters
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
        self.llm = llm or QbOpenAIClient()
        self.syllabus = syllabus or get_syllabus()
        self.store = store or get_store()

    def generate(
        self,
        level: int,
        part_type: str = "fill_blank",
        count: int = 5,
        use_solver: bool = True,
        batch_id: Optional[str] = None,
        dry_run: bool = False
    ) -> QbGenerationSummary:
        """
        Executes question generation for a specific HSK level.
        Enforces max_calls_per_run; handles JSON failures gracefully;
        runs optional solver check; saves questions to store (unless dry_run=True).
        """
        if level < 1 or level > 6:
            raise ValueError(f"Level {level} không được hỗ trợ. QBank chỉ hỗ trợ HSK 1 đến 6.")

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

        # Load existing stems and used vocab_tags for rotation and near-duplicate checking
        existing_stems: List[str] = []
        used_vocab_words: Set[str] = set()
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

        # Build vocabulary pool for target level (ordered by syllabus)
        level_vocab_items = self.syllabus.get_vocab_for_level(level)
        all_vocab_words = [v.word for v in level_vocab_items]
        # Prioritize words not yet tested in DB, then fallback to full list
        unused_vocab = [w for w in all_vocab_words if w not in used_vocab_words]
        vocab_pool = unused_vocab if unused_vocab else all_vocab_words

        vocab_rotation_idx = 0

        while remaining > 0:
            # Check call quota
            if summary.calls_made >= max_calls:
                summary.stopped_reason = f"Đạt giới hạn số lượt gọi LLM tối đa (max_calls_per_run={max_calls})."
                logger.warning(summary.stopped_reason)
                break

            current_batch_count = min(remaining, batch_size)
            summary.batches_attempted += 1

            # Select rotating batch of target vocabulary words
            if vocab_pool:
                target_vocab_subset: List[str] = []
                for _ in range(min(12, len(vocab_pool))):
                    target_vocab_subset.append(vocab_pool[vocab_rotation_idx % len(vocab_pool)])
                    vocab_rotation_idx += 1
                vocab_sample = ", ".join(target_vocab_subset)
            else:
                vocab_sample = "常用词汇"

            prompt_content = (
                template_text
                .replace("{level}", str(level))
                .replace("{batch_size}", str(current_batch_count))
                .replace("{vocab_list}", vocab_sample)
            )


            # 1. Call LLM for generation
            try:
                summary.calls_made += 1
                raw_response = self.llm.generate_chat_completion(
                    messages=[
                        {"role": "system", "content": "You are a professional Chinese language exam item writer."},
                        {"role": "user", "content": prompt_content}
                    ],
                    temperature=self.config.llm_temperature,
                    max_tokens=4096
                )
            except QbLLMQuotaError as e:
                summary.stopped_reason = f"Hết quota LLM: {str(e)}"
                logger.error(summary.stopped_reason)
                break
            except Exception as e:
                logger.error(f"Lỗi khi gọi LLM sinh câu hỏi cho lô {summary.batches_attempted}: {e}")
                summary.batches_failed += 1
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
                    continue
            except Exception as parse_err:
                logger.warning(
                    f"Không thể parse JSON từ phản hồi LLM ở lô {summary.batches_attempted}: {parse_err}. "
                    "Bỏ qua lô này và tiếp tục lần chạy."
                )
                summary.batches_failed += 1
                summary.rejected_by_reason["parse_lỗi"] = summary.rejected_by_reason.get("parse_lỗi", 0) + 1
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

                # A. Structure Validation
                struct_ok, struct_notes = validate_structure(stem, options, answer_index, explanation_vi)

                # B. Clean Characters Validation (Hanzi, punctuation, blanks only; no Latin/Vi/bracket noise)
                char_ok, char_notes = validate_clean_characters(stem, options)

                # C. Fill-in-the-blank Validation (if applicable)
                fill_blank_ok = True
                fill_notes: List[str] = []
                if part_type in ("fill_blank", "reading_part1"):
                    fill_blank_ok, fill_notes = validate_fill_blank(stem, options, answer_index, level=level)

                # D. Vocabulary Level Validation
                eval_text = f"{passage or ''} {stem} {' '.join(options)}"
                level_ok, out_of_level_words, level_notes = validate_level(
                    text=eval_text,
                    target_level=level,
                    syllabus=self.syllabus,
                    threshold=self.config.out_of_level_threshold
                )

                all_notes = struct_notes + char_notes + fill_notes + level_notes

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


                question_id = f"qb_{level}_{part_type}_{uuid.uuid4().hex[:8]}"
                qa_assessment = QbQA(
                    structure_ok=struct_ok,
                    level_ok=level_ok,
                    out_of_level_words=out_of_level_words,
                    notes=all_notes
                )

                model_name = getattr(self.llm, "model", "mock-llm")
                provenance = QbProvenance(
                    origin="original_generated",
                    batch_id=active_batch_id,
                    prompt_version="v1.0",
                    llm_model=model_name,
                    created_at=datetime.now(timezone.utc).isoformat()
                )

                # Determine initial status
                status = "needs_review"
                if not level_ok or is_near_dup:
                    status = "needs_review"

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
                    skill="reading",
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
                temperature=0.1
            )
            cleaned = extract_json_block(raw_solver_res)
            parsed = json.loads(cleaned)
            evals_list = parsed.get("evaluations", []) if isinstance(parsed, dict) else []
            solver_evals = {}
            for item in evals_list:
                if isinstance(item, dict) and "index" in item:
                    solver_evals[item["index"]] = item

            for idx, q in enumerate(questions):
                eval_item = solver_evals.get(idx)
                if eval_item is not None:
                    raw_acceptable = eval_item.get("acceptable_options", [])
                    # Normalize indices to ints
                    acceptable_opts = []
                    for o in raw_acceptable:
                        try:
                            acceptable_opts.append(int(o))
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
                        if q.qa.structure_ok and q.qa.level_ok and self.config.auto_approve:
                            q.status = "approved"
                else:
                    q.status = "needs_review"
                    q.qa.notes.append("Solver response missing for this question index.")
        except Exception as e:
            logger.warning(f"Lỗi khi chạy solver check: {e}. Giữ trạng thái needs_review cho cả lô.")
            for q in questions:
                q.status = "needs_review"
                q.qa.notes.append(f"Solver check failed due to error: {e}")
