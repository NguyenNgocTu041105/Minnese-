import os
import sys
import json
import re
import argparse
import unicodedata
from typing import Optional, List, Dict, Any

# Ensure UTF-8 stdout/stderr on Windows pipes
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from qbank.config import qbank_config
from qbank.models import QbQuestion
from qbank.store import QbStore, get_store
from qbank.generator import QbGenerator
from qbank.syllabus import QbSyllabus, get_syllabus
from qbank.bridge import QbBridge, QbLegacyDBAdapter
from qbank.validators import (
    validate_structure,
    validate_clean_characters,
    validate_character_level,
    validate_level,
    validate_fill_blank
)
from qbank.dedup import compute_content_hash

OFFICIAL_HSK30_WORD_COUNTS = {
    1: 300,
    2: 197,
    3: 491,
    4: 990,
    5: 1579,
    6: 1777,
}


def sanitize_text(text: str) -> str:
    """Masks secrets, API keys, and connection credentials."""
    if not text:
        return text
    # Mask postgres / connection strings
    text = re.sub(r"postgres(?:ql)?://[^\s\"']+", "[REDACTED_DATABASE_URL]", text)
    # Mask Google / Gemini / OpenAI style keys
    text = re.sub(r"AIzaSy[A-Za-z0-9_-]{20,}", "[REDACTED_API_KEY]", text)
    text = re.sub(r"sk-[A-Za-z0-9_-]{20,}", "[REDACTED_API_KEY]", text)
    text = re.sub(r"Bearer\s+[A-Za-z0-9_-]+", "[REDACTED_BEARER]", text)

    api_key = os.getenv("QBANK_LLM_API_KEY")
    if api_key and len(api_key) > 5:
        text = text.replace(api_key, "[REDACTED_API_KEY]")
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key and len(gemini_key) > 5:
        text = text.replace(gemini_key, "[REDACTED_API_KEY]")
    return text


def detect_critical_flags(q: QbQuestion, syllabus: Optional[QbSyllabus] = None) -> Dict[str, Any]:
    """Detects critical safety and quality flags for a question."""
    flags: List[str] = []
    char_noise_reasons: List[str] = []

    clean_ok, char_clean_notes = validate_clean_characters(q.stem, q.options)
    notes_str = " ".join(q.qa.notes).lower()

    if not clean_ok or "chữ_nhiễu" in notes_str or "ký tự không hợp lệ" in notes_str:
        flags.append("char_noise (Ký tự nhiễu: Latin, tiếng Việt, hoặc ngoặc đơn trong stem/options)")
        char_noise_reasons.extend(char_clean_notes)

    if (
        "solver flagged ambiguity" in notes_str
        or "solver mismatch" in notes_str
        or "2 options acceptable" in notes_str
        or "3 options acceptable" in notes_str
    ):
        flags.append("solver_ambiguity (Solver phát hiện đa nghĩa hoặc lệch đáp án)")

    if not q.qa.level_ok or "vượt cấp" in notes_str or "ngoài cấp" in notes_str:
        flags.append("out_of_level_chars (Chữ Hán vượt ngoài cấp độ HSK)")

    if "gần trùng lặp" in notes_str or "trùng lặp" in notes_str:
        flags.append("near_duplicate (Nghi vấn gần trùng lặp với câu có sẵn)")

    if "model dự phòng" in notes_str or "fallback" in notes_str:
        flags.append(f"fallback_model (Sinh bởi model dự phòng: {q.provenance.llm_model})")

    return {
        "flags": flags,
        "has_char_noise": any("char_noise" in f for f in flags),
        "char_noise_reasons": char_noise_reasons,
        "has_solver_ambiguity": any("solver_ambiguity" in f for f in flags),
        "has_out_of_level": any("out_of_level_chars" in f for f in flags),
        "has_critical": len(flags) > 0,
    }


def serialize_question(q: QbQuestion, syllabus: Optional[QbSyllabus] = None) -> Dict[str, Any]:
    """Serializes a QbQuestion to dictionary matching interface contracts."""
    flags_info = detect_critical_flags(q, syllabus)
    return {
        "question_id": q.question_id,
        "level": q.level,
        "skill": q.skill,
        "part_type": q.part_type,
        "stem": q.stem,
        "passage": q.passage,
        "options": q.options,
        "answer_index": q.answer_index,
        "explanation_vi": q.explanation_vi,
        "pinyin_stem": q.pinyin_stem,
        "vocab_tags": q.vocab_tags,
        "topic": q.topic,
        "difficulty": q.difficulty,
        "display_label": q.display_label,
        "status": q.status,
        "content_hash": q.content_hash,
        "provenance": q.provenance.model_dump(),
        "qa": q.qa.model_dump(),
        "options_images": q.options_images or [],
        "audio_url": q.audio_url,
        "critical_flags": flags_info,
    }


def action_stats(store: QbStore, syllabus: Optional[QbSyllabus] = None) -> Dict[str, Any]:
    """Computes stats and syllabus coverage."""
    raw_stats = store.get_stats()
    eligible_count = len(store.get_approved_unsynced_questions())

    syl = syllabus or get_syllabus()
    syllabus_coverage: Dict[str, Dict[str, Any]] = {}
    for lvl in range(1, 7):
        words_for_level = syl.get_words_by_level(lvl)
        total_words = OFFICIAL_HSK30_WORD_COUNTS.get(lvl, len(words_for_level))
        used_words = len(store.get_used_vocab_words(lvl))
        ratio = round(used_words / max(total_words, 1), 4)
        syllabus_coverage[str(lvl)] = {
            "total_words": total_words,
            "used_words": used_words,
            "coverage_ratio": ratio,
        }

    return {
        "success": True,
        "total": raw_stats.get("total_questions", 0),
        "total_questions": raw_stats.get("total_questions", 0),
        "by_status": raw_stats.get("by_status", {}),
        "by_level": raw_stats.get("by_level", {}),
        "by_batch": raw_stats.get("by_batch", {}),
        "flags_summary": raw_stats.get("flags_summary", {}),
        "qa_flags": raw_stats.get("flags_summary", {}),
        "reported_questions": raw_stats.get("reported_questions", 0),
        "eligible_for_sync": eligible_count,
        "syllabus_coverage": syllabus_coverage,
    }


def action_questions(
    store: QbStore,
    level: Optional[int] = None,
    status: Optional[str] = None,
    batch_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    syllabus: Optional[QbSyllabus] = None
) -> Dict[str, Any]:
    """Lists questions with QA and critical flags."""
    # If status is 'all' or empty, filter is None
    stat_filter = None if (not status or status == "all") else status
    all_qs = store.list_questions(
        status=stat_filter,
        level=level,
        batch_id=batch_id,
        limit=max(limit + offset, 200)
    )
    paged_qs = all_qs[offset : offset + limit] if offset > 0 else all_qs[:limit]

    syl = syllabus or get_syllabus()
    items = [serialize_question(q, syl) for q in paged_qs]
    return {
        "success": True,
        "total": len(all_qs),
        "questions": items,
    }


def action_generate(
    store: QbStore,
    level: int = 1,
    count: int = 5,
    part_type: str = "fill_blank",
    use_solver: bool = True,
    dry_run: bool = False
) -> Dict[str, Any]:
    """Generates new questions via QbGenerator."""
    llm = None
    if os.environ.get("QBANK_BRIDGE_MOCK") == "1":
        from qbank.llm import QbMockLLM

        class QbBridgeMockLLM(QbMockLLM):
            """Deterministic Mock LLM for offline bridge generation and Playwright E2E tests."""
            def generate_chat_completion(self, messages, **kwargs):
                self.calls_count += 1
                self.last_usage = {
                    "prompt_tokens": 120,
                    "completion_tokens": 80,
                    "total_tokens": 200,
                    "completion_tokens_details": {"reasoning_tokens": 0}
                }
                if self.predefined_response:
                    return self.predefined_response

                msg_str = " ".join(m.get("content", "") for m in messages).lower()
                if "solver" in msg_str or "auditor" in msg_str:
                    return json.dumps({
                        "evaluations": [
                            {
                                "index": i,
                                "acceptable_options": [0],
                                "analysis": {"0": "Phương án hợp lệ theo ngữ cảnh."}
                            }
                            for i in range(10)
                        ]
                    }, ensure_ascii=False)

                c = self.calls_count
                return json.dumps({
                    "questions": [
                        {
                            "stem": f"今天天气很好，我想去____借两本书。{c}",
                            "options": ["学校", "老师", "朋友", "准备"],
                            "answer_index": 0,
                            "explanation_vi": "Ngữ cảnh đi mượn sách thì địa điểm phù hợp là '学校'.",
                            "topic": "daily_life",
                            "vocab_tags": ["学校", "借", "书"]
                        },
                        {
                            "stem": f"王老师正在____给学生们讲课。{c}",
                            "options": ["学校", "操场", "食堂", "宿舍"],
                            "answer_index": 0,
                            "explanation_vi": "Trong ngữ cảnh giảng bài thì '学校' là thích hợp nhất.",
                            "topic": "school",
                            "vocab_tags": ["学校", "学生"]
                        }
                    ]
                }, ensure_ascii=False)

        llm = QbBridgeMockLLM()

    generator = QbGenerator(store=store, llm=llm)
    summary = generator.generate(
        level=level,
        part_type=part_type,
        count=count,
        use_solver=use_solver,
        dry_run=dry_run
    )

    syl = get_syllabus()
    serialized_generated = [serialize_question(q, syl) for q in summary.generated_questions]

    return {
        "success": True,
        "batch_id": summary.batch_id,
        "count": summary.questions_generated,
        "questions": serialized_generated,
        "generated_questions": serialized_generated,
        "level": summary.level,
        "part_type": summary.part_type,
        "requested_count": summary.requested_count,
        "calls_made": summary.calls_made,
        "batches_attempted": summary.batches_attempted,
        "batches_failed": summary.batches_failed,
        "questions_generated": summary.questions_generated,
        "questions_saved": summary.questions_saved,
        "approved_count": summary.approved_count,
        "needs_review_count": summary.needs_review_count,
        "rejected_count": summary.rejected_validation_count + summary.duplicate_count,
        "models_used": summary.models_used,
        "stopped_reason": summary.stopped_reason,
        "is_dry_run": summary.is_dry_run,
    }


def action_review(
    store: QbStore,
    question_id: str,
    action: str,
    override_reason: Optional[str] = None,
    stem: Optional[str] = None,
    options: Optional[List[str]] = None,
    answer_index: Optional[int] = None,
    explanation_vi: Optional[str] = None,
    level: Optional[int] = None,
    syllabus: Optional[QbSyllabus] = None
) -> Dict[str, Any]:
    """Reviews, approves, rejects, or edits a question."""
    q = store.get_question(question_id)
    if not q:
        raise ValueError(f"Không tìm thấy câu hỏi với ID: {question_id}")

    syl = syllabus or get_syllabus()

    if action == "approve":
        flags_info = detect_critical_flags(q, syl)
        # HARD BLOCK: Reject questions with character noise
        if flags_info["has_char_noise"]:
            reasons = "; ".join(flags_info["char_noise_reasons"])
            raise ValueError(f"Không thể duyệt câu hỏi chứa ký tự nhiễu (Latin/Vi/ngoặc đơn): {reasons}")

        if flags_info["has_critical"]:
            reason = (override_reason or "").strip() or "Người duyệt đã kiểm tra thủ công và xác nhận đạt yêu cầu"
            q.qa.notes.append(f"Người duyệt thủ công xác nhận: {reason}")
            q.status = "approved"
            store.save_question(q)
        else:
            store.update_status(q.question_id, "approved")
            q.status = "approved"

        updated = serialize_question(q, syl)
        return {
            "success": True,
            "question_id": q.question_id,
            "status": "approved",
            "question": updated,
            "updated_question": updated,
        }

    elif action == "reject":
        store.delete_question(q.question_id)
        return {
            "success": True,
            "question_id": q.question_id,
            "status": "deleted",
        }

    elif action == "edit":
        if stem is None or options is None or answer_index is None:
            raise ValueError("Khi chỉnh sửa (action='edit'), bắt buộc phải truyền stem, options, và answer_index.")

        if len(options) != 4:
            raise ValueError(f"Options phải có đúng 4 phương án, nhận được {len(options)}.")

        norm_stem = unicodedata.normalize("NFC", stem.strip())
        norm_opts = [unicodedata.normalize("NFC", opt.strip()) for opt in options]
        if len(set(norm_opts)) != 4:
            raise ValueError("Các phương án lựa chọn không được trùng lặp nội dung.")

        if not (0 <= answer_index < 4):
            raise ValueError(f"answer_index phải từ 0 đến 3, nhận được {answer_index}.")

        new_expl = explanation_vi if explanation_vi is not None else q.explanation_vi
        new_level = level if (level is not None and 1 <= level <= 6) else q.level

        # Run validations
        s_ok, s_notes = validate_structure(norm_stem, norm_opts, answer_index, new_expl)
        c_ok, c_notes = validate_clean_characters(norm_stem, norm_opts)
        f_ok, f_notes = validate_fill_blank(norm_stem, norm_opts, answer_index, level=new_level)

        filled = norm_stem.replace("____", norm_opts[answer_index]) if "____" in norm_stem else norm_stem
        cl_ok, cl_det, cl_notes = validate_character_level(filled, target_level=new_level, syllabus=syl, char_budget=0.05)
        wl_ok, wl_words, wl_notes = validate_level(filled, target_level=new_level, syllabus=syl, threshold=0.05)

        q.stem = norm_stem
        q.options = norm_opts
        q.answer_index = answer_index
        q.explanation_vi = new_expl
        q.level = new_level
        q.qa.structure_ok = s_ok
        q.qa.level_ok = cl_ok
        q.qa.out_of_level_words = wl_words

        # Filter old structure/noise notes and append new ones
        q.qa.notes = [n for n in q.qa.notes if not n.startswith("Cấu trúc") and not n.startswith("Chữ nhiễu")]
        q.qa.notes.extend(s_notes + c_notes + f_notes + cl_notes)
        q.qa.notes.append("Đã chỉnh sửa thủ công")

        # RECOMPUTE CONTENT HASH
        q.content_hash = QbQuestion.compute_hash(norm_stem, norm_opts, answer_index)

        saved = store.save_question(q)
        if not saved:
            raise ValueError("Không thể lưu câu hỏi: nội dung chỉnh sửa bị trùng lặp với một câu hỏi khác trong kho (trùng content_hash).")
        updated = serialize_question(q, syl)
        return {
            "success": True,
            "question_id": q.question_id,
            "status": q.status,
            "content_hash": q.content_hash,
            "question": updated,
            "updated_question": updated,
        }

    else:
        raise ValueError(f"Hành động không hợp lệ: '{action}'. Chỉ hỗ trợ 'approve', 'reject', 'edit'.")


def action_sync(
    store: QbStore,
    batch_id: Optional[str] = None,
    level: Optional[int] = None,
    limit: Optional[int] = None,
    execute: bool = False,
    legacy_db_path: Optional[str] = None
) -> Dict[str, Any]:
    """Syncs approved questions to legacy database."""
    adapter = QbLegacyDBAdapter(sqlite_path=legacy_db_path) if legacy_db_path else QbLegacyDBAdapter()
    bridge = QbBridge(store=store, adapter=adapter)

    res = bridge.sync(
        batch_id=batch_id,
        level=level,
        limit=limit,
        execute=execute,
        confirmed_postgres_backup=True
    )

    return {
        "success": True,
        "batch_id": res.batch_id,
        "is_dry_run": res.is_dry_run,
        "total_eligible": res.total_eligible,
        "count_synced": res.synced_count,
        "synced_count": res.synced_count,
        "skipped_duplicate_hash": res.skipped_duplicate_hash,
        "skipped_near_duplicate": res.skipped_near_duplicate,
        "skipped_blocked_flags": res.skipped_blocked_flags,
        "backup_path": res.backup_file,
        "backup_file": res.backup_file,
        "blocked_questions": res.blocked_questions,
        "records": res.records,
    }


def parse_payload(payload_str: Optional[str]) -> Dict[str, Any]:
    """Parses JSON payload string or returns empty dict."""
    if not payload_str:
        return {}
    try:
        return json.loads(payload_str)
    except Exception as e:
        raise ValueError(f"Payload JSON không hợp lệ: {e}")


def main():
    parser = argparse.ArgumentParser(description="QBank API Bridge CLI")
    parser.add_argument("action", choices=["stats", "questions", "generate", "review", "sync"], help="Action to execute")
    parser.add_argument("--payload", type=str, default=None, help="JSON payload string")
    parser.add_argument("--db-path", type=str, default=None, help="Custom QBank SQLite path")
    parser.add_argument("--legacy-db-path", type=str, default=None, help="Custom Legacy Web SQLite path")

    # Optional CLI direct parameters for convenience
    parser.add_argument("--level", type=int, default=None)
    parser.add_argument("--status", type=str, default=None)
    parser.add_argument("--batch-id", type=str, default=None)
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--offset", type=int, default=0)
    parser.add_argument("--count", type=int, default=5)
    parser.add_argument("--part-type", type=str, default="fill_blank")
    parser.add_argument("--solver", action="store_true", default=None)
    parser.add_argument("--no-solver", action="store_true", default=False)
    parser.add_argument("--dry-run", action="store_true", default=False)
    parser.add_argument("--execute", action="store_true", default=False)
    parser.add_argument("--question-id", type=str, default=None)
    parser.add_argument("--review-action", type=str, default=None)
    parser.add_argument("--override-reason", type=str, default=None)

    args = parser.parse_args()

    # Read stdin if payload is "-"
    raw_payload = args.payload
    if raw_payload == "-":
        raw_payload = sys.stdin.read()

    try:
        payload = parse_payload(raw_payload)
        store = QbStore(db_path=args.db_path) if args.db_path else get_store()
        syllabus = get_syllabus()

        response: Dict[str, Any] = {}

        if args.action == "stats":
            response = action_stats(store, syllabus)

        elif args.action == "questions":
            lvl = payload.get("level", args.level)
            stat = payload.get("status", args.status)
            b_id = payload.get("batch_id", args.batch_id)
            lim = int(payload.get("limit", args.limit or 50))
            off = int(payload.get("offset", args.offset or 0))
            response = action_questions(store, level=lvl, status=stat, batch_id=b_id, limit=lim, offset=off, syllabus=syllabus)

        elif args.action == "generate":
            lvl = int(payload.get("level", args.level or 1))
            cnt = int(payload.get("count", args.count or 5))
            ptype = str(payload.get("part_type", args.part_type or "fill_blank"))
            use_solv = payload.get("use_solver")
            if use_solv is None:
                use_solv = False if args.no_solver else True
            dry = bool(payload.get("dry_run", args.dry_run))
            response = action_generate(store, level=lvl, count=cnt, part_type=ptype, use_solver=use_solv, dry_run=dry)

        elif args.action == "review":
            qid = payload.get("question_id", args.question_id)
            rev_act = payload.get("action", args.review_action)
            reason = payload.get("override_reason", args.override_reason)
            stem = payload.get("stem")
            options = payload.get("options")
            ans_idx = payload.get("answer_index")
            explanation_vi = payload.get("explanation_vi")
            lvl = payload.get("level")

            if not qid:
                raise ValueError("Thiếu question_id")
            if not rev_act:
                raise ValueError("Thiếu action ('approve', 'reject', hoặc 'edit')")

            response = action_review(
                store=store,
                question_id=qid,
                action=rev_act,
                override_reason=reason,
                stem=stem,
                options=options,
                answer_index=ans_idx,
                explanation_vi=explanation_vi,
                level=lvl,
                syllabus=syllabus
            )

        elif args.action == "sync":
            b_id = payload.get("batch_id", args.batch_id)
            lvl = payload.get("level", args.level)
            lim = payload.get("limit")
            exec_flag = payload.get("execute", args.execute)
            legacy_path = payload.get("legacy_db_path", args.legacy_db_path)
            response = action_sync(
                store=store,
                batch_id=b_id,
                level=lvl,
                limit=lim,
                execute=bool(exec_flag),
                legacy_db_path=legacy_path
            )

        print(json.dumps(response, ensure_ascii=False))
        sys.exit(0)

    except Exception as e:
        err_msg = sanitize_text(str(e))
        err_response = {"success": False, "error": err_msg}
        print(json.dumps(err_response, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
