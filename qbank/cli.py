import os
import sys
import json
import argparse
from typing import Optional, List, Dict, Any, Tuple

# Reconfigure stdout/stderr for Unicode (Vietnamese & Chinese) compatibility on Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from qbank.config import qbank_config
from qbank.models import QbQuestion
from qbank.store import get_store
from qbank.generator import QbGenerator
from qbank.syllabus import get_syllabus


def handle_generate(args: argparse.Namespace) -> int:
    """Executes the generate command."""
    if getattr(args, "section", None):
        count_display = f"{args.n} (chỉ định qua --n)" if getattr(args, "n", None) is not None else "Theo blueprint"
        print(f"\n[QBank Generator] Bắt đầu sinh câu hỏi HSK {args.level} theo phần thi '{args.section}'...")
        print(f"- Số lượng yêu cầu mỗi phần: {count_display}")
        print(f"- Model chính: {qbank_config.llm_model}")
        if qbank_config.fallback_models:
            print(f"- Model dự phòng: {', '.join(qbank_config.fallback_models)}")
        print(f"- Solver verification: {'Bật' if args.solver else 'Tắt'}")
        print(f"- Chế độ: {'DRY-RUN (Không lưu vào DB)' if args.dry_run else 'Thực thi (Lưu vào DB)'}")

        generator = QbGenerator()
        try:
            summaries = generator.generate_section(
                level=args.level,
                section=args.section,
                count_per_part=getattr(args, "n", None),
                use_solver=args.solver,
                dry_run=args.dry_run,
                skill=getattr(args, "skill", None)
            )
        except Exception as e:
            print(f"\n[LỖI] Sinh câu hỏi theo phần thất bại: {e}", file=sys.stderr)
            return 1

        print("\n" + "=" * 60)
        print(f"       KẾT QUẢ SINH CÂU HỎI THEO PHẦN '{args.section.upper()}' (HSK {args.level})")
        print("=" * 60)
        total_gen = sum(s.questions_generated for s in summaries)
        total_saved = sum(s.questions_saved for s in summaries)
        total_approved = sum(s.approved_count for s in summaries)
        total_review = sum(s.needs_review_count for s in summaries)
        total_rejected = sum(s.rejected_validation_count + s.duplicate_count for s in summaries)

        for s in summaries:
            print(f"Phần nhỏ '{s.part_type}': {s.questions_saved}/{s.requested_count} câu đạt (Duyệt: {s.approved_count}, Cần duyệt: {s.needs_review_count})")

        print("-" * 60)
        print(f"Tổng câu sinh ra:          {total_gen}")
        print(f"Câu đạt tiêu chuẩn lưu:    {total_saved}")
        print(f"  - Tự động duyệt (đạt):   {total_approved}")
        print(f"  - Cần người xem xét:     {total_review}")
        print(f"Câu bị loại bỏ:            {total_rejected}")
        print("=" * 60)

        if args.dry_run:
            print("\n[DRY-RUN] Không có câu hỏi nào được lưu vào cơ sở dữ liệu.")
        elif total_review > 0:
            print(f"\nĐể duyệt {total_review} câu hỏi trên, hãy chạy:")
            print(f"  python -m qbank.cli review --level {args.level}")

        return 0

    n_count = getattr(args, "n", None)
    count = n_count if n_count is not None else 5
    print(f"\n[QBank Generator] Bắt đầu sinh câu hỏi HSK {args.level}...")
    print(f"- Loại câu hỏi: {args.part}")
    print(f"- Số lượng yêu cầu: {count}")
    print(f"- Model chính: {qbank_config.llm_model}")
    if qbank_config.fallback_models:
        print(f"- Model dự phòng: {', '.join(qbank_config.fallback_models)}")
    print(f"- Solver verification: {'Bật' if args.solver else 'Tắt'}")
    print(f"- Chế độ: {'DRY-RUN (Không lưu vào DB)' if args.dry_run else 'Thực thi (Lưu vào DB)'}")

    generator = QbGenerator()
    try:
        summary = generator.generate(
            level=args.level,
            part_type=args.part,
            count=count,
            use_solver=args.solver,
            dry_run=args.dry_run,
            skill=getattr(args, "skill", None)
        )
    except Exception as e:
        print(f"\n[LỖI] Sinh câu hỏi thất bại: {e}", file=sys.stderr)
        return 1

    print("\n" + "=" * 60)
    print("                KẾT QUẢ SINH CÂU HỎI")
    print("=" * 60)
    print(f"Batch ID:                  {summary.batch_id}")
    print(f"Số câu yêu cầu:            {summary.requested_count}")
    print(f"Số cuộc gọi LLM đã dùng:  {summary.calls_made}")
    print(f"Lô thử / Lô lỗi:           {summary.batches_attempted} / {summary.batches_failed}")
    print(f"Số lần chia đôi lô:        {summary.split_batch_count}")
    print(f"Số lần dùng fallback model:{summary.fallback_count}")
    print(f"Tổng câu sinh ra:          {summary.questions_generated}")
    print(f"Câu đạt tiêu chuẩn lưu:    {summary.questions_saved}")
    print(f"  - Tự động duyệt (đạt):   {summary.approved_count}")
    print(f"  - Cần người xem xét:     {summary.needs_review_count}")
    print(f"Câu bị loại bỏ:            {summary.rejected_validation_count + summary.duplicate_count}")

    if summary.models_used:
        print("\nModel thực tế đã dùng sinh câu hỏi:")
        for m_name, cnt in summary.models_used.items():
            print(f"  - {m_name}: {cnt} câu")

    if getattr(summary, "token_usage_by_model", None):
        print("\nThống kê Token sử dụng theo Model:")
        for m_name, usage in summary.token_usage_by_model.items():
            p = usage.get("prompt_tokens", 0)
            c = usage.get("completion_tokens", 0)
            r = usage.get("reasoning_tokens", 0)
            t = usage.get("total_tokens", 0)
            r_str = f" (Reasoning: {r})" if r else ""
            print(f"  - {m_name}:")
            print(f"      Prompt tokens:     {p:>6}")
            print(f"      Completion tokens: {c:>6}{r_str}")
            print(f"      Total tokens:      {t:>6}")

    if summary.failure_counts_by_type:
        print("\nPhân loại lỗi theo lô:")
        for err_type, cnt in summary.failure_counts_by_type.items():
            print(f"  - {err_type}: {cnt} lô")

    if summary.rejected_by_reason:
        print("\nChi tiết lý do loại bỏ câu hỏi:")
        for reason, cnt in summary.rejected_by_reason.items():
            print(f"  - {reason}: {cnt} câu")

    if summary.stopped_reason:
        print(f"\nLý do dừng sớm:            {summary.stopped_reason}")
    print("=" * 60)

    # In chi tiết các câu đã sinh
    if summary.generated_questions:
        print(f"\nChi tiết {len(summary.generated_questions)} câu hỏi:")
        for idx, q in enumerate(summary.generated_questions, 1):
            opts_str = " | ".join([f"{chr(65 + i)}. {opt}" for i, opt in enumerate(q.options)])
            correct_opt = f"{chr(65 + q.answer_index)}. {q.options[q.answer_index]}"
            status_tag = f"[{q.status.upper()}]"
            print(f"\n{idx}. {status_tag} ID: {q.question_id} | Model: {q.provenance.llm_model}")
            if q.passage:
                print(f"   Đoạn văn: {q.passage}")
            print(f"   Câu dẫn:  {q.stem}")
            print(f"   Lựa chọn: {opts_str}")
            print(f"   Đáp án:   {correct_opt}")
            print(f"   Giải thích: {q.explanation_vi}")
            if q.qa.notes:
                print(f"   Ghi chú QA: {'; '.join(q.qa.notes)}")

    if args.dry_run:
        print("\n[DRY-RUN] Không có câu hỏi nào được lưu vào cơ sở dữ liệu.")
    elif summary.needs_review_count > 0:
        print(f"\nĐể duyệt {summary.needs_review_count} câu hỏi trên, hãy chạy:")
        print(f"  python -m qbank.cli review --level {args.level}")

    return 0


def _detect_critical_flags(q: QbQuestion, syllabus=None) -> Dict[str, Any]:
    """Detects critical safety and quality flags for a question."""
    from qbank.validators import validate_clean_characters
    flags = []
    char_noise_reasons = []

    clean_ok, char_clean_notes = validate_clean_characters(q.stem, q.options)
    notes_str = " ".join(q.qa.notes).lower()

    if not clean_ok or "chữ_nhiễu" in notes_str or "ký tự không hợp lệ" in notes_str:
        flags.append("char_noise (Ký tự nhiễu: Latin, tiếng Việt, hoặc ngoặc đơn trong stem/options)")
        char_noise_reasons.extend(char_clean_notes)

    if "solver flagged ambiguity" in notes_str or "solver mismatch" in notes_str:
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
        "has_critical": len(flags) > 0,
    }


def _shorten_note(note: str) -> str:
    """Shortens lengthy QA notes like solver JSON details for clean display."""
    if "Details:" in note:
        prefix = note.split("Details:")[0].strip()
        return f"{prefix} (Bấm 'd' để xem chi tiết JSON)"
    if len(note) > 120:
        return note[:117] + "..."
    return note


def _format_char_level_info(q: QbQuestion, syllabus) -> List[str]:
    """Evaluates and formats character-level grading as the primary metric."""
    from qbank.validators import validate_character_level, validate_level
    filled_stem = q.stem
    if 0 <= q.answer_index < len(q.options):
        ans_str = str(q.options[q.answer_index]).strip()
        if "____" in q.stem:
            filled_stem = q.stem.replace("____", ans_str)
        else:
            filled_stem = f"{q.stem} {ans_str}"
    eval_text = f"{q.passage or ''} {filled_stem}".strip()

    char_ok, char_details, _ = validate_character_level(
        text=eval_text,
        target_level=q.level,
        syllabus=syllabus,
        char_budget=0.05
    )
    ratio = char_details.get("out_of_level_ratio", 0.0)
    out_chars = char_details.get("out_of_level_chars", [])

    out_char_strs = []
    for c in out_chars:
        lvl = syllabus.get_char_level(c)
        lvl_str = f"L{lvl}" if lvl is not None else "Ngoài danh mục"
        out_char_strs.append(f"{c}({lvl_str})")

    status_str = "OK" if char_ok else "VƯỢT CẤP"
    lines = [
        f"  - Cấp độ Chữ Hán (Tiêu chí chính): {status_str}",
        f"    * Tỷ lệ chữ vượt cấp: {ratio:.1%} (Ngân sách cho phép: 5.0%)",
    ]
    if out_char_strs:
        lines.append(f"    * Danh sách chữ vượt cấp: {', '.join(out_char_strs)}")

    # Reference word level via jieba segmentation
    word_ok, out_words, _ = validate_level(
        text=eval_text,
        target_level=q.level,
        syllabus=syllabus,
        threshold=0.05
    )
    if out_words:
        lines.append(f"  - Ghi chú từ vựng tham khảo (Jieba phân đoạn): Từ ngoài cấp = {', '.join(out_words)}")
    else:
        lines.append("  - Ghi chú từ vựng tham khảo (Jieba phân đoạn): OK")
    return lines


def _display_question_card(idx: int, total: int, q: QbQuestion, syllabus, info: Dict[str, Any]) -> None:
    """Prints the question review card with critical flags banner at the very top."""
    # 1. Critical Flags Banner (AT TOP, PROMINENT)
    if info["has_critical"]:
        print("\n" + "*" * 70)
        print("🚨 [CẢNH BÁO NGUY HIỂM / CRITICAL FLAGS TẠI CÂU NÀY]")
        for f in info["flags"]:
            print(f"   ► {f}")
        print("*" * 70)

    # 2. Main Question Card Header & Metadata
    print("\n" + "=" * 70)
    print(f"[{idx}/{total}] ID: {q.question_id} | Level: HSK {q.level} | Dạng: {q.part_type}")
    created_time = (q.provenance.created_at or "")[:19].replace("T", " ")
    print(f"Batch ID: {q.provenance.batch_id} | Model sinh: {q.provenance.llm_model} | Ngày sinh: {created_time}")
    print("-" * 70)
    if q.passage:
        print(f"Đoạn văn:\n  {q.passage}")
    print(f"Câu dẫn (Stem):\n  {q.stem}")
    print("Phương án lựa chọn:")
    for i, opt in enumerate(q.options):
        marker = " (ĐÁP ÁN ĐÚNG)" if i == q.answer_index else ""
        print(f"  [{i}] {chr(65 + i)}. {opt}{marker}")
    print(f"Giải thích (VI):\n  {q.explanation_vi}")

    print("\nĐánh giá Chất lượng & QA:")
    print(f"  - Cấu trúc: {'OK' if q.qa.structure_ok else 'LỖI'}")
    for l in _format_char_level_info(q, syllabus):
        print(l)

    if q.qa.notes:
        print("  - Ghi chú QA tóm tắt:")
        for n in q.qa.notes:
            print(f"    * {_shorten_note(n)}")
    print("=" * 70)


def handle_review(args: argparse.Namespace) -> int:
    """Executes the safe interactive review command."""
    store = get_store()
    syllabus = get_syllabus()

    batch_id_filter = getattr(args, "batch_id", None)
    since_filter = getattr(args, "since", None)
    flagged_only = getattr(args, "flagged_only", False)

    questions = store.list_questions(
        status="needs_review",
        level=args.level,
        batch_id=batch_id_filter,
        since=since_filter,
        limit=args.limit
    )

    if flagged_only:
        questions = [q for q in questions if _detect_critical_flags(q, syllabus)["has_critical"]]

    if not questions:
        lvl_str = f" HSK {args.level}" if args.level else ""
        b_str = f" thuộc batch '{batch_id_filter}'" if batch_id_filter else ""
        f_str = " có gắn cờ cảnh báo" if flagged_only else ""
        print(f"\nKhông có câu hỏi nào cần duyệt (needs_review){lvl_str}{b_str}{f_str}.")
        return 0

    total = len(questions)
    print(f"\n[QBank Review] Tìm thấy {total} câu hỏi cần duyệt.")
    print("Nhập [a]pprove, [r]eject, [s]kip, [e]dit, [l]evel, [u]ndo, [d]etails, hoặc [q]uit.\n")

    approved_count = 0
    rejected_count = 0
    skipped_count = 0
    history: List[Tuple[QbQuestion, str, str]] = []  # (question, old_status, action_status)

    idx = 0
    while idx < len(questions):
        q = questions[idx]
        info = _detect_critical_flags(q, syllabus)
        _display_question_card(idx + 1, total, q, syllabus, info)

        while True:
            try:
                choice = input("Hành động: [a]pprove / [r]eject / [s]kip / [e]dit / [l]evel / [u]ndo / [d]etails / [q]uit > ").strip().lower()
            except (EOFError, KeyboardInterrupt):
                print("\nĐã hủy quá trình duyệt.")
                return 0

            if choice in ("a", "approve"):
                # 1. Hard block if char_noise is present
                if info["has_char_noise"]:
                    print("\n⛔ LỖI BẢO MẬT CHẤT LƯỢNG:")
                    print("   Câu hỏi chứa KÝ TỰ NHIỄU (chữ Latin, tiếng Việt hoặc ghi chú ngoặc đơn trong stem/options).")
                    print("   QUY TẮC AN TOÀN: TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP DUYỆT CÂU NÀY!")
                    print("   -> Vui lòng bấm 'e' để sửa thủ công, 'r' để từ chối (reject), hoặc 's' để bỏ qua (skip).\n")
                    continue

                # 2. Require 'duyet' confirmation + 1-line reason if other critical flags exist
                if info["has_critical"]:
                    print("\n⚠️ CẢNH BÁO: Câu hỏi này đang có cờ cảnh báo nguy hiểm:")
                    for f in info["flags"]:
                        print(f"  * {f}")
                    print("Để duyệt câu này, bạn BẮT BUỘC phải gõ chính xác từ 'duyet' và cung cấp lý do xác nhận.")
                    confirm = input("Nhập 'duyet' để xác nhận duyệt vượt cảnh báo: ").strip().lower()
                    if confirm != "duyet":
                        print("Đã hủy duyệt câu này.\n")
                        continue
                    reason = input("Lý do chấp nhận duyệt (1 dòng): ").strip()
                    if not reason:
                        reason = "Người duyệt đã kiểm tra thủ công và xác nhận đạt yêu cầu"
                    q.qa.notes.append(f"Người duyệt thủ công xác nhận: {reason}")
                    q.status = "approved"
                    store.save_question(q)
                    approved_count += 1
                    history.append((q, "needs_review", "approved"))
                    print(f"✓ Đã duyệt với lý do xác nhận: '{reason}'.\n")
                    idx += 1
                    break
                else:
                    store.update_status(q.question_id, "approved")
                    approved_count += 1
                    history.append((q, "needs_review", "approved"))
                    print("✓ Đã duyệt (status='approved').\n")
                    idx += 1
                    break

            elif choice in ("r", "reject"):
                store.update_status(q.question_id, "rejected")
                rejected_count += 1
                history.append((q, "needs_review", "rejected"))
                print("✗ Đã từ chối (status='rejected').\n")
                idx += 1
                break

            elif choice in ("s", "skip", ""):
                skipped_count += 1
                print("- Đã bỏ qua.\n")
                idx += 1
                break

            elif choice in ("d", "details"):
                print("\n" + "-" * 40)
                print("        CHI TIẾT ĐẦY ĐỦ CÂU HỎI")
                print("-" * 40)
                print(f"Question ID:  {q.question_id}")
                print(f"Level:        HSK {q.level}")
                print(f"Batch ID:     {q.provenance.batch_id}")
                print(f"Model:        {q.provenance.llm_model}")
                print(f"Created at:   {q.provenance.created_at}")
                print(f"Content hash: {q.content_hash}")
                print(f"Vocab tags:   {q.vocab_tags}")
                print("Toàn bộ Ghi chú QA:")
                for n in q.qa.notes:
                    print(f"  * {n}")
                print("-" * 40 + "\n")
                continue

            elif choice in ("e", "edit"):
                print("\n[CHỈNH SỬA THỦ CÔNG]")
                print("Nhấn Enter để giữ nguyên giá trị hiện tại.")
                new_stem = input(f"Câu dẫn mới [{q.stem}]: ").strip() or q.stem
                new_options = []
                for i, opt in enumerate(q.options):
                    new_o = input(f"Phương án [{chr(65+i)}] [{opt}]: ").strip() or opt
                    new_options.append(new_o)
                ans_idx_str = input(f"Vị trí đáp án đúng (0-3 hoặc A-D) [{chr(65+q.answer_index)}]: ").strip().upper()
                new_ans_idx = q.answer_index
                if ans_idx_str in ("A", "B", "C", "D"):
                    new_ans_idx = ord(ans_idx_str) - ord("A")
                elif ans_idx_str.isdigit() and 0 <= int(ans_idx_str) < len(new_options):
                    new_ans_idx = int(ans_idx_str)

                q.stem = new_stem
                q.options = new_options
                q.answer_index = new_ans_idx

                from qbank.validators import (
                    validate_structure,
                    validate_clean_characters,
                    validate_character_level,
                    validate_level,
                    validate_fill_blank
                )
                from qbank.dedup import compute_content_hash

                s_ok, s_notes = validate_structure(q.stem, q.options, q.answer_index, q.explanation_vi)
                c_ok, c_notes = validate_clean_characters(q.stem, q.options)
                f_ok, f_notes = validate_fill_blank(q.stem, q.options, q.answer_index, level=q.level)
                filled = q.stem.replace("____", q.options[q.answer_index]) if "____" in q.stem else q.stem
                cl_ok, cl_det, cl_notes = validate_character_level(filled, target_level=q.level, syllabus=syllabus, char_budget=0.05)
                wl_ok, wl_words, wl_notes = validate_level(filled, target_level=q.level, syllabus=syllabus, threshold=0.05)

                q.qa.structure_ok = s_ok
                q.qa.level_ok = cl_ok
                q.qa.out_of_level_words = wl_words
                q.qa.notes = [n for n in q.qa.notes if not n.startswith("Cấu trúc") and not n.startswith("Chữ nhiễu")]
                q.qa.notes.extend(s_notes + c_notes + f_notes + cl_notes)
                q.qa.notes.append("Đã chỉnh sửa thủ công")
                q.content_hash = compute_content_hash(q.stem, q.options, q.answer_index)
                store.save_question(q)
                print("\n✓ Đã lưu thay đổi chỉnh sửa vào cơ sở dữ liệu.")
                info = _detect_critical_flags(q, syllabus)
                _display_question_card(idx + 1, total, q, syllabus, info)
                continue

            elif choice in ("l", "level"):
                lvl_str = input(f"Nhập cấp độ HSK mới (1-6) [hiện tại: HSK {q.level}]: ").strip()
                if not lvl_str.isdigit() or int(lvl_str) not in range(1, 7):
                    print("Cấp độ không hợp lệ. Vui lòng nhập từ 1 đến 6.\n")
                    continue
                new_lvl = int(lvl_str)
                conf = input(f"Xác nhận đổi cấp độ từ HSK {q.level} sang HSK {new_lvl}? (y/n) > ").strip().lower()
                if conf == "y":
                    q.level = new_lvl
                    filled = q.stem.replace("____", q.options[q.answer_index]) if "____" in q.stem else q.stem
                    from qbank.validators import validate_character_level, validate_level
                    cl_ok, cl_det, cl_notes = validate_character_level(filled, target_level=new_lvl, syllabus=syllabus, char_budget=0.05)
                    wl_ok, wl_words, wl_notes = validate_level(filled, target_level=new_lvl, syllabus=syllabus, threshold=0.05)
                    q.qa.level_ok = cl_ok
                    q.qa.out_of_level_words = wl_words
                    q.qa.notes.append(f"Đã đổi cấp độ sang HSK {new_lvl}")
                    store.save_question(q)
                    print(f"✓ Đã đổi cấp độ sang HSK {new_lvl}.\n")
                    info = _detect_critical_flags(q, syllabus)
                    _display_question_card(idx + 1, total, q, syllabus, info)
                continue

            elif choice in ("u", "undo"):
                if not history:
                    print("Không có thao tác nào trước đó để hoàn tác.\n")
                    continue
                prev_q, old_status, act_status = history.pop()
                store.update_status(prev_q.question_id, old_status)
                if act_status == "approved":
                    approved_count = max(0, approved_count - 1)
                elif act_status == "rejected":
                    rejected_count = max(0, rejected_count - 1)
                print(f"↺ Đã hoàn tác: Câu '{prev_q.question_id}' được trả về trạng thái '{old_status}'.\n")
                # Step back to previous question if possible
                if idx > 0:
                    idx -= 1
                break

            elif choice in ("q", "quit", "exit"):
                print("\nĐã dừng quá trình duyệt.")
                _print_review_summary(approved_count, rejected_count, skipped_count, total)
                return 0
            else:
                print("Lựa chọn không hợp lệ. Vui lòng nhập 'a', 'r', 's', 'e', 'l', 'u', 'd', hoặc 'q'.")

    _print_review_summary(approved_count, rejected_count, skipped_count, total)
    return 0


def _print_review_summary(approved: int, rejected: int, skipped: int, total: int) -> None:
    print("\n" + "=" * 40)
    print("           TỔNG KẾT PHIÊN DUYỆT")
    print("=" * 40)
    print(f"Đã duyệt (approved):   {approved}")
    print(f"Từ chối (rejected):    {rejected}")
    print(f"Bỏ qua (skipped):      {skipped}")
    print(f"Tổng số trong đợt:     {total}")
    print("=" * 40)


def handle_set_status(args: argparse.Namespace) -> int:
    """Executes the set-status command to manually adjust question status."""
    store = get_store()
    q = store.get_question(args.question_id)
    if not q:
        print(f"[LỖI] Không tìm thấy câu hỏi với ID: '{args.question_id}'", file=sys.stderr)
        return 1

    old_status = q.status
    if args.reason:
        q.qa.notes.append(f"Chuyển trạng thái thủ công ({old_status} -> {args.status}): {args.reason}")
    q.status = args.status
    store.save_question(q)
    print(f"✓ Đã cập nhật câu hỏi '{q.question_id}': status '{old_status}' -> '{args.status}'")
    if args.reason:
        print(f"  Lý do: {args.reason}")
    return 0


def handle_recheck(args: argparse.Namespace) -> int:
    """
    Executes the recheck command.
    Re-evaluates questions with current syllabus and validators (NO LLM calls).
    Downgrades any 'approved' questions with critical flags to 'needs_review'.
    NEVER promotes 'needs_review' to 'approved'.
    """
    from qbank.validators import (
        validate_structure,
        validate_clean_characters,
        validate_character_level,
        validate_level,
        validate_fill_blank
    )
    store = get_store()
    syllabus = get_syllabus()

    print("\n" + "=" * 60)
    print("         KIỂM TRA LẠI CHẤT LƯỢNG KHO CÂU HỎI (RECHECK)")
    print("=" * 60)
    print(f"Chế độ: {'THỰC THI (Lưu thay đổi vào DB)' if args.execute else 'DRY-RUN (CHỈ KIỂM TRA, KHÔNG ĐỔI DB)'}")
    if args.level:
        print(f"Lọc theo cấp độ HSK: {args.level}")

    questions = store.list_questions(level=args.level, limit=100000)
    if not questions:
        print("Không có câu hỏi nào trong kho cần kiểm tra.")
        return 0

    total_checked = len(questions)
    downgraded_count = 0
    downgraded_list: List[Dict[str, Any]] = []

    for q in questions:
        struct_ok, struct_notes = validate_structure(q.stem, q.options, q.answer_index, q.explanation_vi)
        char_ok, char_notes = validate_clean_characters(q.stem, q.options)
        fill_blank_ok = True
        fill_notes: List[str] = []
        if q.part_type in ("fill_blank", "reading_part1"):
            fill_blank_ok, fill_notes = validate_fill_blank(q.stem, q.options, q.answer_index, level=q.level)

        filled_stem = q.stem
        if 0 <= q.answer_index < len(q.options):
            ans_str = str(q.options[q.answer_index]).strip()
            if "____" in q.stem:
                filled_stem = q.stem.replace("____", ans_str)
            else:
                filled_stem = f"{q.stem} {ans_str}"
        eval_stem_text = f"{q.passage or ''} {filled_stem}".strip()

        char_level_ok, char_details, char_level_notes = validate_character_level(
            text=eval_stem_text,
            target_level=q.level,
            syllabus=syllabus,
            char_budget=0.05
        )

        for opt_idx, opt in enumerate(q.options):
            opt_ok, opt_details, opt_notes = validate_character_level(
                text=str(opt),
                target_level=q.level,
                syllabus=syllabus,
                char_budget=0.0
            )
            if not opt_ok:
                char_level_ok = False
                char_level_notes.append(f"Phương án [{opt_idx}] '{opt}' chứa chữ vượt cấp: {opt_details.get('out_of_level_chars', [])}")

        critical_reasons = []
        if not struct_ok:
            critical_reasons.append(f"Cấu trúc không hợp lệ: {struct_notes}")
        if not char_ok:
            critical_reasons.append(f"Ký tự nhiễu: {char_notes}")
        if not fill_blank_ok:
            critical_reasons.append(f"Lỗi fill_blank: {fill_notes}")
        if not char_level_ok:
            critical_reasons.append(f"Vượt cấp chữ Hán: {char_level_notes}")

        solver_notes = [n for n in q.qa.notes if "Solver flagged" in n or "Solver mismatch" in n]
        if solver_notes:
            critical_reasons.extend(solver_notes)

        # Rule: Any approved question that fails critical checks is downgraded to needs_review
        # NEVER promote needs_review to approved
        if q.status == "approved" and critical_reasons:
            downgraded_count += 1
            downgraded_list.append({
                "id": q.question_id,
                "level": q.level,
                "reasons": critical_reasons,
                "stem": q.stem
            })
            if args.execute:
                q.status = "needs_review"
                q.qa.notes.append(f"Tự động hạ cấp bởi recheck: {'; '.join(critical_reasons)}")
                q.qa.structure_ok = struct_ok
                q.qa.level_ok = char_level_ok
                store.save_question(q)

    print("\n" + "-" * 40)
    print("           TỔNG KẾT KIỂM TRA LẠI")
    print("-" * 40)
    print(f"Tổng số câu đã kiểm tra:       {total_checked}")
    print(f"Số câu 'approved' bị hạ cấp:   {downgraded_count}")

    if downgraded_list:
        print("\nDanh sách câu hỏi bị hạ cấp về 'needs_review':")
        for item in downgraded_list:
            print(f"  * [{item['id']}] HSK {item['level']}: {item['stem'][:30]}...")
            for r in item["reasons"]:
                print(f"      - {r}")

    if not args.execute and downgraded_count > 0:
        print("\n[LƯU Ý] Đây là chế độ DRY-RUN. Để thực thi cập nhật trạng thái trong DB, hãy thêm cờ: --execute")
    print("=" * 60)
    return 0


def handle_stats(args: argparse.Namespace) -> int:
    """Executes the stats command with detailed breakdowns."""
    store = get_store()
    stats = store.get_stats()

    print("\n" + "=" * 60)
    print("             THỐNG KÊ KHO CÂU HỎI QBANK")
    print("=" * 60)
    print(f"Tổng số câu hỏi:           {stats['total_questions']}")
    print(f"Đường dẫn DB:              {store.db_path}")

    print("\nTheo trạng thái duyệt:")
    by_status = stats.get("by_status", {})
    if by_status:
        for status, count in sorted(by_status.items()):
            print(f"  - {status:<15}: {count:>4} câu")
    else:
        print("  (Chưa có dữ liệu)")

    print("\nTheo cấp độ HSK (1 - 6):")
    by_level = stats.get("by_level", {})
    if by_level:
        for lvl in range(1, 7):
            cnt = by_level.get(lvl, 0)
            print(f"  - HSK {lvl}: {cnt:>4} câu")
    else:
        print("  (Chưa có dữ liệu)")

    print("\nTheo Batch ID:")
    by_batch = stats.get("by_batch", {})
    if by_batch:
        for b_id, cnt in sorted(by_batch.items()):
            print(f"  - {b_id:<38}: {cnt:>4} câu")
    else:
        print("  (Chưa có dữ liệu)")

    print("\nTổng hợp cờ cảnh báo rủi ro (Flags Summary):")
    flags = stats.get("flags_summary", {})
    if flags:
        print(f"  - Solver ambiguity (đa nghĩa/lệch đáp án): {flags.get('solver_ambiguity', 0):>4} câu")
        print(f"  - Chữ nhiễu (Latin/Việt/ngoặc):             {flags.get('char_noise', 0):>4} câu")
        print(f"  - Chữ Hán ngoài cấp (out-of-level):         {flags.get('out_of_level_chars', 0):>4} câu")
        print(f"  - Nghi vấn gần trùng lặp (near-duplicate):  {flags.get('near_duplicate', 0):>4} câu")
        print(f"  - Sinh bởi model dự phòng (fallback):       {flags.get('fallback_model', 0):>4} câu")
    else:
        print("  (Chưa có dữ liệu)")

    print(f"\nSố câu học viên báo lỗi:   {stats.get('reported_questions', 0)}")
    print("=" * 60)
    return 0


def handle_syllabus_check(args: argparse.Namespace) -> int:
    """Executes the syllabus-check command."""
    vocab_path = args.path if hasattr(args, "path") and args.path else None
    syllabus = get_syllabus(vocab_file_path=vocab_path)
    stats = syllabus.get_stats()

    print("\n" + "=" * 60)
    print("            KIỂM TRA TỪ ĐIỂN SYLLABUS HSK 3.0")
    print("=" * 60)
    print(f"Đường dẫn file:       {stats['vocab_file']}")
    print(f"Tổng số từ hợp lệ:    {stats['total_valid_items']}")
    print(f"Tổng số dòng bị loại: {stats['total_rejected']}")

    print("\nSố từ hợp lệ theo cấp độ HSK (1 - 6):")
    for lvl in range(1, 7):
        cnt = stats["by_level"].get(lvl, 0)
        print(f"  - HSK {lvl}: {cnt:>5} từ")

    if stats["total_rejected"] > 0:
        print("\nTổng hợp lý do loại bỏ:")
        for reason, count in stats["rejection_summary"].items():
            print(f"  - {reason}: {count} dòng")

        if args.verbose:
            print("\nChi tiết các dòng bị loại (tối đa 20 dòng đầu):")
            for r in stats["rejections"][:20]:
                word_info = f" (từ: {r.get('word')})" if r.get('word') else ""
                print(f"  * Dòng {r.get('line')}{word_info}: {r.get('reason')}")
    else:
        print("\nKhông có dòng nào bị loại. Toàn bộ từ vựng hợp lệ.")

    print("=" * 60)
    return 0


def build_parser() -> argparse.ArgumentParser:
    """Constructs the CLI argument parser."""
    parser = argparse.ArgumentParser(
        prog="python -m qbank.cli",
        description="QBank CLI: Quản lý, sinh câu hỏi và duyệt đề luyện thi HSK 3.0"
    )
    subparsers = parser.add_subparsers(dest="command", help="Lệnh chức năng")

    # 1. generate
    gen_parser = subparsers.add_parser("generate", help="Sinh câu hỏi HSK mới")
    gen_parser.add_argument("--level", type=int, required=True, choices=range(1, 7), help="Cấp độ HSK (1 - 6)")
    gen_parser.add_argument("--part", type=str, default="fill_blank", help="Dạng bài (mặc định: fill_blank, hoặc dạng bài từ blueprint)")
    gen_parser.add_argument("--section", type=str, default=None, help="Phần thi trong blueprint (ví dụ: listening, reading, writing)")
    gen_parser.add_argument("--skill", type=str, default=None, choices=["listening", "reading", "writing", "speaking", "vocabulary", "grammar"], help="Kỹ năng mục tiêu (tùy chọn)")
    gen_parser.add_argument("--n", type=int, default=None, help="Số lượng câu hỏi muốn sinh")
    gen_parser.add_argument("--dry-run", action="store_true", default=False, help="Chạy thử nghiệm, in kết quả không lưu vào DB")
    gen_parser.add_argument("--solver", dest="solver", action="store_true", default=True, help="Bật kiểm tra đối soát bằng LLM solver (mặc định)")
    gen_parser.add_argument("--no-solver", dest="solver", action="store_false", help="Tắt kiểm tra đối soát bằng LLM solver")

    # 2. review
    rev_parser = subparsers.add_parser("review", help="Duyệt câu hỏi đang chờ xem xét (needs_review)")
    rev_parser.add_argument("--level", type=int, choices=range(1, 7), default=None, help="Lọc theo cấp độ HSK")
    rev_parser.add_argument("--batch", dest="batch_id", type=str, default=None, help="Lọc theo mã batch_id cụ thể")
    rev_parser.add_argument("--since", type=str, default=None, help="Lọc câu hỏi sinh từ ngày YYYY-MM-DD")
    rev_parser.add_argument("--flagged-only", dest="flagged_only", action="store_true", default=False, help="Chỉ hiển thị các câu có cờ cảnh báo (critical flags)")
    rev_parser.add_argument("--limit", type=int, default=50, help="Số lượng câu hỏi tối đa hiển thị (mặc định: 50)")

    # 3. stats
    subparsers.add_parser("stats", help="Xem thống kê tổng quan kho câu hỏi")

    # 4. syllabus-check
    syll_parser = subparsers.add_parser("syllabus-check", help="Kiểm tra tính hợp lệ và thống kê từ điển syllabus")
    syll_parser.add_argument("--path", type=str, default=None, help="Đường dẫn file vocab.jsonl tùy chọn")
    syll_parser.add_argument("--verbose", "-v", action="store_true", help="Hiển thị chi tiết từng dòng bị loại")

    # 5. sync
    sync_parser = subparsers.add_parser("sync", help="Đồng bộ câu hỏi đã duyệt (approved) sang bảng questions cũ")
    sync_parser.add_argument("--batch-id", type=str, default=None, help="Lọc theo mã batch_id cụ thể")
    sync_parser.add_argument("--level", type=int, choices=range(1, 7), default=None, help="Lọc theo cấp độ HSK")
    sync_parser.add_argument("--limit", type=int, default=None, help="Số lượng câu hỏi tối đa muốn đồng bộ")
    sync_parser.add_argument("--execute", action="store_true", default=False, help="Thực thi ghi thật vào DB cũ (mặc định: dry-run chỉ đọc)")
    sync_parser.add_argument("--i-have-backed-up-postgres", dest="confirm_pg", action="store_true", default=False, help="Xác nhận đã tự sao lưu nếu chạy trên PostgreSQL production")

    # 6. retire
    ret_parser = subparsers.add_parser("retire", help="Vô hiệu hóa (chuyển status='rejected') các câu đã đồng bộ theo batch_id")
    ret_parser.add_argument("--batch-id", type=str, required=True, help="Mã batch_id cần vô hiệu hóa")
    ret_parser.add_argument("--dry-run", action="store_true", default=False, help="Chạy thử nghiệm kiểm tra số lượng câu sẽ bị vô hiệu hóa")
    ret_parser.add_argument("--yes", "-y", action="store_true", default=False, help="Tự động đồng ý xác nhận không cần hỏi lại")

    # 7. export-approved
    exp_parser = subparsers.add_parser("export-approved", help="Xuất các câu hỏi đã duyệt (approved) chưa đồng bộ ra file JSONL")
    exp_parser.add_argument("--out", type=str, required=True, help="Đường dẫn file JSONL đầu ra")
    exp_parser.add_argument("--batch-id", type=str, default=None, help="Lọc theo mã batch_id cụ thể")
    exp_parser.add_argument("--level", type=int, choices=range(1, 7), default=None, help="Lọc theo cấp độ HSK")
    exp_parser.add_argument("--include-exported", action="store_true", default=False, help="Bao gồm cả các câu đã xuất trước đó trong qb_export_log")

    # 8. import-approved
    imp_parser = subparsers.add_parser(
        "import-approved",
        help="Nhập câu hỏi từ file JSONL vào kho QBank (chỉ ghi vào qbank.db; sau khi nhập, chạy 'review' rồi 'sync')"
    )
    imp_parser.add_argument("--in", dest="input_file", type=str, required=True, help="Đường dẫn file JSONL đầu vào")
    imp_parser.add_argument("--trust-approved", action="store_true", default=False, help="Giữ nguyên status='approved' khi nạp; nếu không có cờ này, nạp thành 'needs_review'")
    imp_parser.add_argument("--batch-id", type=str, default=None, help="Gán batch_id mới cho các câu nạp (nếu muốn gom lô)")
    imp_parser.add_argument("--allow-no-manifest", action="store_true", default=False, help="Cho phép nạp file không có dòng manifest (mặc định: bắt buộc có manifest)")
    imp_parser.add_argument("--execute", action="store_true", default=False, help="Thực thi ghi thật vào qbank.db (mặc định: dry-run chỉ đọc)")

    # 9. import-vocab
    vocab_parser = subparsers.add_parser(
        "import-vocab",
        help="Nhập từ vựng syllabus HSK từ file CSV/TSV, XLSX hoặc PDF (không OCR, không gọi LLM, không mạng)"
    )
    vocab_parser.add_argument("file", type=str, help="Đường dẫn file từ vựng nguồn (.csv, .tsv, .xlsx, .pdf)")
    vocab_parser.add_argument("--source", type=str, required=True, help="Tên nguồn tài liệu từ vựng (bắt buộc)")
    vocab_parser.add_argument(
        "--license-status",
        dest="license_status",
        type=str,
        required=True,
        choices=["official", "permitted", "self-authored"],
        help="Trạng thái bản quyền/giấy phép: official | permitted | self-authored (bắt buộc, không có mặc định)"
    )
    vocab_parser.add_argument("--level", type=int, choices=range(1, 7), default=None, help="Cấp độ HSK mặc định (1 - 6)")
    vocab_parser.add_argument("--map", dest="column_map", type=str, default=None, help="Ánh xạ cột tùy chỉnh (ví dụ: word=Từ,pinyin=Phát_âm,level=Cấp_độ)")
    vocab_parser.add_argument("--sheet", dest="sheet_name", type=str, default=None, help="Tên sheet cần đọc nếu là file Excel (.xlsx)")
    vocab_parser.add_argument(
        "--mode",
        type=str,
        default="merge",
        choices=["merge", "replace"],
        help="Chế độ nhập: merge (mặc định: gộp từ mới, từ trùng giữ level thấp nhất) hoặc replace (thay thế toàn bộ)"
    )
    vocab_parser.add_argument(
        "--split-variants",
        action="store_true",
        default=False,
        help="Tự động phân rã các từ có biến thể (| hoặc ngoặc đơn) thành các từ riêng biệt"
    )
    vocab_parser.add_argument("--execute", action="store_true", default=False, help="Thực thi ghi thật vào vocab.jsonl (mặc định: dry-run xem trước)")
    vocab_parser.add_argument("--target-vocab-path", type=str, default=None, help=argparse.SUPPRESS)
    vocab_parser.add_argument("--rejected-csv-path", type=str, default=None, help=argparse.SUPPRESS)

    # 10. list-models
    list_parser = subparsers.add_parser(
        "list-models",
        help="Liệt kê danh sách model khả dụng từ endpoint LLM (gọi GET /models, không in API key)"
    )
    list_parser.add_argument(
        "--all",
        action="store_true",
        default=False,
        help="Xem toàn bộ model từ endpoint (không ẩn các model embedding/tts/image...)"
    )
    list_parser.add_argument(
        "--text-only",
        dest="text_only",
        action="store_true",
        default=True,
        help="Chỉ hiển thị các model dạng văn bản/chat (mặc định: bật; lọc theo tên)"
    )

    # 11. probe-model
    probe_parser = subparsers.add_parser(
        "probe-model",
        help="Gửi 1 request tối thiểu kiểm tra kết nối, độ trễ và tham số của từng model (tốn 1 lượt hạn mức mỗi model)"
    )
    probe_parser.add_argument(
        "models",
        nargs="*",
        help="Tên các model cần probe (mặc định: toàn bộ model trong QBANK_LLM_MODEL và QBANK_LLM_FALLBACK_MODELS)"
    )

    # 12. set-status
    set_parser = subparsers.add_parser(
        "set-status",
        help="Cập nhật trạng thái duyệt của câu hỏi thủ công (draft, needs_review, approved, rejected)"
    )
    set_parser.add_argument("question_id", type=str, help="ID câu hỏi (ví dụ: qb_1_fill_blank_...)")
    set_parser.add_argument("status", type=str, choices=["draft", "needs_review", "approved", "rejected"], help="Trạng thái mới")
    set_parser.add_argument("--reason", type=str, default=None, help="Lý do cập nhật trạng thái (lưu vào qa.notes)")

    # 13. recheck
    rech_parser = subparsers.add_parser(
        "recheck",
        help="Kiểm tra lại chất lượng câu hỏi với validator và từ điển hiện tại (không gọi LLM, hạ cấp approved về needs_review)"
    )
    rech_parser.add_argument("--level", type=int, choices=range(1, 7), default=None, help="Lọc theo cấp độ HSK")
    rech_parser.add_argument("--execute", action="store_true", default=False, help="Thực thi lưu thay đổi vào DB (mặc định: dry-run xem trước)")

    # 14. blueprint
    bp_parser = subparsers.add_parser(
        "blueprint",
        help="Xem cấu trúc blueprint đề thi HSK chuẩn (3.0)"
    )
    bp_parser.add_argument("--level", type=int, choices=range(1, 7), default=None, help="Cấp độ HSK (1 - 6)")
    bp_parser.add_argument("--section", type=str, default=None, help="Chỉ xem chi tiết một phần thi cụ thể (ví dụ: listening, reading, writing)")
    bp_parser.add_argument("--json", action="store_true", default=False, help="In ra định dạng JSON thô")

    return parser



def handle_sync(args: argparse.Namespace) -> int:
    """Executes the sync command."""
    from qbank.bridge import QbBridge
    bridge = QbBridge()

    print("\n" + "=" * 60)
    print("         ĐỒNG BỘ CÂU HỎI SANG BẢNG QUESTIONS CŨ")
    print("=" * 60)
    print(f"Chế độ:               {'THỰC THI GHI VÀO DB' if args.execute else 'DRY-RUN (CHỈ ĐỌC, KHÔNG GHI)'}")
    if args.batch_id:
        print(f"Lọc theo Batch ID:    {args.batch_id}")
    if args.level:
        print(f"Lọc theo Cấp độ HSK:  {args.level}")
    if args.limit:
        print(f"Giới hạn số câu:      {args.limit}")

    try:
        res = bridge.sync(
            batch_id=args.batch_id,
            limit=args.limit,
            execute=args.execute,
            level=args.level,
            confirmed_postgres_backup=args.confirm_pg
        )
    except Exception as e:
        print(f"\n[LỖI] Đồng bộ thất bại: {e}", file=sys.stderr)
        return 1

    print("\n" + "-" * 40)
    print("           TỔNG KẾT ĐỒNG BỘ")
    print("-" * 40)
    print(f"- Số câu đủ điều kiện:        {res.total_eligible}")
    if args.execute:
        print(f"- Số câu đã ghi thật vào DB:  {res.synced_count}")
    else:
        print(f"- Số câu dự kiến sẽ ghi:      {res.synced_count}")
    print(f"- Số câu bỏ qua:              {res.skipped_duplicate_hash + res.skipped_near_duplicate + res.skipped_blocked_flags}")
    if res.skipped_duplicate_hash > 0:
        print(f"  * Lý do trùng content_hash:   {res.skipped_duplicate_hash}")
    if res.skipped_near_duplicate > 0:
        print(f"  * Lý do nghi trùng 4-gram:    {res.skipped_near_duplicate}")
    if res.skipped_blocked_flags > 0:
        print(f"  * Lý do vi phạm cờ an toàn:   {res.skipped_blocked_flags}")
        print("\nDanh sách câu hỏi bị chặn đồng bộ do cờ cảnh báo:")
        for b in res.blocked_questions:
            print(f"  - [{b.get('question_id')}]: {b.get('reason')}")
    if res.backup_file:
        print(f"- File sao lưu SQLite:        {res.backup_file}")

    if res.records:
        print(f"\nDanh sách {len(res.records)} câu hỏi:")
        for r in res.records[:10]:
            print(f"  * ID cũ: {r['legacy_id']} | ID QBank: {r['question_id']} | {r['stem'][:25]}...")
        if len(res.records) > 10:
            print(f"  ... và {len(res.records) - 10} câu khác.")

    if not args.execute:
        print("\n[LƯU Ý] Đây là chế độ DRY-RUN. Để thực thi ghi thật, hãy thêm cờ: --execute")
    print("=" * 60)
    return 0


def handle_retire(args: argparse.Namespace) -> int:
    """Executes the retire command."""
    from qbank.bridge import QbBridge
    store = get_store()
    bridge = QbBridge(store=store)

    records = store.get_sync_records_by_batch(args.batch_id)
    active_records = [r for r in records if r.status == "active"]

    print("\n" + "=" * 60)
    print("           VÔ HIỆU HÓA CÂU HỎI THEO BATCH ID")
    print("=" * 60)
    print(f"Batch ID:              {args.batch_id}")
    print(f"Tổng số bản ghi sync:  {len(records)}")
    print(f"Số dòng đang active:   {len(active_records)}")

    if not active_records:
        print("\nKhông tìm thấy câu hỏi active nào thuộc batch này trong qb_sync_log.")
        print("=" * 60)
        return 0

    if args.dry_run:
        print(f"\n[DRY-RUN] Dự kiến sẽ chuyển {len(active_records)} dòng sang status='rejected' ở DB cũ")
        print(f"và status='retired' ở qbank.db.")
        print("Danh sách ID sẽ đổi:")
        for r in active_records[:10]:
            print(f"  * Legacy ID: {r.legacy_id} | QBank ID: {r.question_id}")
        if len(active_records) > 10:
            print(f"  ... và {len(active_records) - 10} dòng khác.")
        print("\n[LƯU Ý] Đây là chế độ DRY-RUN. Không có thay đổi nào được thực hiện.")
        print("=" * 60)
        return 0

    if not args.yes:
        confirm = input(f"\nBạn có chắc chắn muốn vô hiệu hóa {len(active_records)} câu hỏi thuộc batch '{args.batch_id}'? [y/N]: ").strip().lower()
        if confirm not in ("y", "yes"):
            print("Đã hủy thao tác.")
            return 0

    try:
        count = bridge.retire(batch_id=args.batch_id)
    except Exception as e:
        print(f"\n[LỖI] Vô hiệu hóa thất bại: {e}", file=sys.stderr)
        return 1

    print(f"\nĐã vô hiệu hóa thành công {count} câu hỏi (status chuyển thành 'rejected' ở DB cũ và 'retired' ở QBank).")
    print("=" * 60)
    return 0


def handle_export_approved(args: argparse.Namespace) -> int:
    """
    Executes the export-approved command:
    - Filters approved questions not yet synced to legacy DB.
    - Excludes questions already in qb_export_log unless --include-exported is set.
    - Exports to JSONL with schema_version in metadata and an SHA-256 manifest line at the end.
    - Records exported questions in qb_export_log.
    """
    import json
    import hashlib
    store = get_store()

    questions = store.get_approved_unsynced_questions(
        batch_id=args.batch_id,
        level=args.level,
        include_exported=args.include_exported
    )
    print("\n" + "=" * 60)
    print("       XUẤT CÂU HỎI ĐÃ DUYỆT (CHƯA ĐỒNG BỘ)")
    print("=" * 60)
    print(f"File đầu ra:          {args.out}")
    print(f"Bao gồm đã xuất:      {'Có' if args.include_exported else 'Không'}")
    print(f"Số câu tìm thấy:      {len(questions)}")

    if not questions:
        print("Không có câu hỏi nào thỏa mãn điều kiện để xuất.")
        print("=" * 60)
        return 0

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True) if os.path.dirname(args.out) else None

    # Write questions lines and compute rolling sha256 of question lines
    hasher = hashlib.sha256()
    with open(args.out, "w", encoding="utf-8") as f:
        for q in questions:
            line_str = json.dumps(q.model_dump(), ensure_ascii=False) + "\n"
            hasher.update(line_str.encode("utf-8"))
            f.write(line_str)

        # Write final manifest line
        manifest = {
            "_manifest": True,
            "schema_version": "1.0",
            "question_count": len(questions),
            "content_checksum_sha256": hasher.hexdigest()
        }
        f.write(json.dumps(manifest, ensure_ascii=False) + "\n")

    # Record to qb_export_log
    qids = [q.question_id for q in questions]
    store.record_export(qids, os.path.abspath(args.out))

    print(f"Đã xuất thành công {len(questions)} câu vào: {args.out}")
    print(f"Mã checksum SHA-256:  {hasher.hexdigest()[:16]}...")
    print(f"Đã ghi log vào bảng:  qb_export_log ({len(questions)} bản ghi)")
    print("=" * 60)
    return 0


def handle_import_approved(args: argparse.Namespace) -> int:
    """
    Executes the import-approved command:
    - Validates manifest checksum at the end of the file if present.
    - Each line validated strictly via QbQuestion.model_validate.
    - Refuses invalid rows or rows with extra fields.
    - If not --trust-approved, forces status = 'needs_review'.
    - Skips duplicate content_hash or existing question_id.
    - Default dry-run: only logs what would happen without writing.
    - When --execute: writes into qbank.db and runs bridge sync.
    """
    import json
    import hashlib
    from pydantic import ValidationError
    from qbank.models import QbQuestion, QbProvenance
    from qbank.bridge import QbBridge

    if not os.path.exists(args.input_file):
        print(f"[LỖI] File không tồn tại: {args.input_file}", file=sys.stderr)
        return 1

    store = get_store()
    print("\n" + "=" * 60)
    print("       NHẬP CÂU HỎI VÀ ĐỒNG BỘ SANG BẢNG QUESTIONS CŨ")
    print("=" * 60)
    print(f"File đầu vào:         {args.input_file}")
    print(f"Chế độ phê duyệt:     {'GIỮ NGUYÊN APPROVED (--trust-approved)' if args.trust_approved else 'CHUYỂN THÀNH NEEDS_REVIEW (Mặc định an toàn)'}")
    print(f"Chế độ thực thi:      {'THỰC THI GHI VÀO DB (--execute)' if args.execute else 'DRY-RUN (CHỈ ĐỌC, KHÔNG GHI)'}")

    # Read all lines
    with open(args.input_file, "r", encoding="utf-8") as f:
        raw_lines = [line for line in f if line.strip()]

    if not raw_lines:
        print("[LỖI] File rỗng, không có dữ liệu để nhập.", file=sys.stderr)
        return 1

    # Check for trailing manifest
    manifest_info = None
    question_lines = raw_lines
    try:
        last_obj = json.loads(raw_lines[-1])
        if isinstance(last_obj, dict) and last_obj.get("_manifest") is True:
            manifest_info = last_obj
            question_lines = raw_lines[:-1]
    except Exception:
        pass

    if manifest_info:
        schema_ver = manifest_info.get("schema_version")
        if schema_ver != "1.0":
            print(f"[LỖI MANIFEST] schema_version '{schema_ver}' không tương thích (chỉ hỗ trợ phiên bản '1.0')!", file=sys.stderr)
            return 1

        expected_checksum = manifest_info.get("content_checksum_sha256")
        expected_count = manifest_info.get("question_count")
        hasher = hashlib.sha256()
        for ql in question_lines:
            hasher.update(ql.encode("utf-8"))
        actual_checksum = hasher.hexdigest()
        if expected_checksum and actual_checksum != expected_checksum:
            print(f"[LỖI TOÀN VẸN] Checksum file không khớp manifest! (kỳ vọng: {expected_checksum[:16]}..., thực tế: {actual_checksum[:16]}...)", file=sys.stderr)
            return 1
        if expected_count is not None and len(question_lines) != expected_count:
            print(f"[LỖI TOÀN VẸN] Số câu trong file ({len(question_lines)}) khác manifest ({expected_count})!", file=sys.stderr)
            return 1
        print(f"- Xác thực manifest:  HỢP LỆ (schema_version={schema_ver}, checksum khớp)")
    else:
        if not getattr(args, "allow_no_manifest", False):
            print("[LỖI MANIFEST] File thiếu dòng manifest xác thực ở cuối! Để bỏ qua và tiếp tục nạp, hãy truyền cờ --allow-no-manifest.", file=sys.stderr)
            return 1
        print("- Xác thực manifest:  KHÔNG CÓ (cho phép qua cờ --allow-no-manifest)")

    # Validate each line
    valid_candidates: list[QbQuestion] = []
    rejected_reasons: list[str] = []

    for idx, ql in enumerate(question_lines, start=1):
        try:
            data = json.loads(ql)
            if not isinstance(data, dict):
                rejected_reasons.append(f"Dòng {idx}: Không phải JSON object")
                continue

            # Strict Pydantic validation (hash match, 4 options, level 1-6, extra='forbid')
            q = QbQuestion.model_validate(data)

            # Adjust status based on --trust-approved
            if not args.trust_approved:
                # Need to update model and recompute or retain hash (status not in hash)
                q_dict = q.model_dump()
                q_dict["status"] = "needs_review"
                if args.batch_id:
                    q_dict["provenance"]["batch_id"] = args.batch_id
                q = QbQuestion.model_validate(q_dict)
            elif args.batch_id:
                q_dict = q.model_dump()
                q_dict["provenance"]["batch_id"] = args.batch_id
                q = QbQuestion.model_validate(q_dict)

            valid_candidates.append(q)
        except ValidationError as ve:
            err_msg = "; ".join([f"{e['loc']}: {e['msg']}" for e in ve.errors()[:2]])
            rejected_reasons.append(f"Dòng {idx}: Sai cấu trúc hoặc trường lạ ({err_msg})")
        except Exception as e:
            rejected_reasons.append(f"Dòng {idx}: Lỗi {e}")

    # Check for duplicates against existing DB
    questions_to_save: list[QbQuestion] = []
    skipped_dup_hash = 0
    skipped_dup_qid = 0

    with store.session() as conn:
        cur = conn.cursor()
        cur.execute("SELECT question_id, content_hash FROM qb_questions;")
        existing_rows = cur.fetchall()
        existing_qids = {r["question_id"] for r in existing_rows}
        existing_hashes = {r["content_hash"] for r in existing_rows}

    for q in valid_candidates:
        if q.question_id in existing_qids:
            skipped_dup_qid += 1
            continue
        if q.content_hash in existing_hashes:
            skipped_dup_hash += 1
            continue
        questions_to_save.append(q)
        existing_qids.add(q.question_id)
        existing_hashes.add(q.content_hash)

    print("\n" + "-" * 40)
    print("           KẾT QUẢ KIỂM TRA ĐẦU VÀO")
    print("-" * 40)
    print(f"- Tổng số dòng trong file:    {len(question_lines)}")
    print(f"- Dòng hợp lệ:                {len(valid_candidates)}")
    print(f"- Dòng bị từ chối:            {len(rejected_reasons)}")
    if rejected_reasons:
        for r in rejected_reasons[:5]:
            print(f"  * {r}")
        if len(rejected_reasons) > 5:
            print(f"  ... và {len(rejected_reasons) - 5} dòng khác.")
    print(f"- Bỏ qua do trùng question_id:{skipped_dup_qid}")
    print(f"- Bỏ qua do trùng content_hash:{skipped_dup_hash}")
    print(f"- Số câu sẵn sàng nạp:        {len(questions_to_save)}")

    if not args.execute:
        print("\n[LƯU Ý] Đây là chế độ DRY-RUN (Mặc định). Chưa có câu nào được ghi vào DB.")
        print("Để thực thi ghi thật vào qbank.db, vui lòng chạy lại với cờ: --execute")
        print("Sau khi nạp, hãy chạy lệnh 'review' để kiểm duyệt hoặc 'sync' để đồng bộ sang DB cũ.")
        print("=" * 60)
        return 0

    # Write to QBank store ONLY - KHÔNG gọi QbBridge.sync
    saved_count = 0
    for q in questions_to_save:
        if store.save_question(q):
            saved_count += 1

    print(f"\n[THỰC THI] Đã lưu thành công {saved_count} câu vào kho QBank (qbank.db).")
    print("[HƯỚNG DẪN TIẾP THEO]")
    print("1. Chạy lệnh: python -m qbank.cli review --level <level> (nếu cần duyệt)")
    print("2. Chạy lệnh: python -m qbank.cli sync (dry-run mặc định) hoặc sync --execute (để đồng bộ sang DB cũ)")
    print("=" * 60)
    return 0


def handle_import_vocab(args: argparse.Namespace) -> int:
    """Executes the import-vocab command."""
    from qbank.vocab_importer import QbVocabImporter

    # Enforce required arguments explicitly
    if not args.source or not args.source.strip():
        print("[LỖI] Bắt buộc phải cung cấp tham số --source.", file=sys.stderr)
        return 1

    if not args.license_status or not args.license_status.strip():
        print("[LỖI] Bắt buộc phải cung cấp tham số --license-status (official|permitted|self-authored).", file=sys.stderr)
        return 1

    print("\n" + "=" * 60)
    print("           NHẬP TỪ VỰNG SYLLABUS HSK 3.0")
    print("=" * 60)
    print(f"- File nguồn:         {args.file}")
    print(f"- Nguồn tài liệu:     {args.source}")
    print(f"- Giấy phép/Bản quyền:{args.license_status}")
    if args.level:
        print(f"- Cấp độ mặc định:    HSK {args.level}")
    if args.column_map:
        print(f"- Ánh xạ cột (--map): {args.column_map}")
    if args.sheet_name:
        print(f"- Sheet Excel:        {args.sheet_name}")
    print(f"- Chế độ (--mode):    {args.mode.upper()}")
    print(f"- Trạng thái chạy:    {'THỰC THI GHI VÀO FILE' if args.execute else 'DRY-RUN (CHỈ ĐỌC, KHÔNG GHI)'}")

    try:
        importer = QbVocabImporter(
            file_path=args.file,
            source=args.source,
            license_status=args.license_status,
            default_level=args.level,
            column_map=args.column_map,
            sheet_name=args.sheet_name,
            mode=args.mode,
            split_variants=getattr(args, "split_variants", False),
            target_vocab_path=getattr(args, "target_vocab_path", None),
            rejected_csv_path=getattr(args, "rejected_csv_path", None)
        )
        summary = importer.process(execute=args.execute)
    except Exception as e:
        print(f"\n[LỖI] Quá trình nhập từ vựng thất bại: {e}", file=sys.stderr)
        return 1

    print("\n" + "-" * 40)
    print("         10 DÒNG ĐẦU TIÊN (XEM TRƯỚC)")
    print("-" * 40)
    if summary.valid_items:
        for idx, item in enumerate(summary.valid_items[:10], start=1):
            pos_str = f" [{item.pos}]" if item.pos else ""
            print(f"  {idx:>2}. {item.word:<8} {item.pinyin:<15}{pos_str:<10} -> HSK {item.level}")
        if len(summary.valid_items) > 10:
            print(f"  ... và còn {len(summary.valid_items) - 10} từ hợp lệ khác.")
    else:
        print("  (Không có từ hợp lệ nào được trích xuất)")

    print("\n" + "-" * 40)
    print("         THỐNG KÊ SỐ TỪ THEO LEVEL")
    print("-" * 40)
    print(f"- Tổng số từ hợp lệ (độc nhất): {len(summary.valid_items)}")
    print(f"- Số dòng trùng được gộp (giữ cấp thấp nhất): {summary.merged_duplicates_count}")
    if summary.split_variants_count > 0:
        print(f"- Số biến thể đã phân rã:       {summary.split_variants_count}")
    for lvl in range(1, 7):
        cnt = summary.by_level.get(lvl, 0)
        print(f"  * HSK {lvl}: {cnt:>5} từ")

    print("\n" + "-" * 40)
    print("         THỐNG KÊ DÒNG BỊ LOẠI")
    print("-" * 40)
    print(f"- Tổng số dòng bị loại:         {len(summary.rejected_rows)}")
    if summary.rejected_by_reason:
        for reason, count in summary.rejected_by_reason.items():
            print(f"  * {reason}: {count} dòng")
        print(f"- Chi tiết dòng lỗi đã ghi tại: {summary.rejected_csv_path}")
    else:
        print("  * Không có dòng nào bị loại.")

    if summary.warnings:
        print("\n" + "-" * 40)
        print("         CẢNH BÁO PINYIN (KHÔNG LOẠI BỎ)")
        print("-" * 40)
        for w in summary.warnings[:10]:
            print(f"  [CẢNH BÁO] {w}")
        if len(summary.warnings) > 10:
            print(f"  ... và {len(summary.warnings) - 10} cảnh báo pinyin khác.")

    if not args.execute:
        print("\n" + "=" * 60)
        print("[LƯU Ý] Đây là chế độ DRY-RUN (Mặc định). File vocab.jsonl CHƯA bị thay đổi.")
        print("Hãy so sánh 10 dòng đầu và số từ mỗi level với tài liệu gốc.")
        print("Để thực thi ghi thật, vui lòng chạy lại với cờ: --execute")
        print("=" * 60)
        return 0

    print("\n" + "=" * 60)
    print(f"[THỰC THI] Đã lưu thành công {summary.saved_count} từ vào file: {summary.output_path}")
    if summary.backup_file:
        print(f"File sao lưu cũ: {summary.backup_file}")
    print("=" * 60)

    # Tự động chạy syllabus-check sau --execute
    print("\n[TỰ ĐỘNG KIỂM TRA] Chạy syllabus-check sau khi cập nhật từ điển:")
    check_ns = argparse.Namespace(path=summary.output_path, verbose=False)
    handle_syllabus_check(check_ns)
    return 0


def handle_list_models(args: argparse.Namespace) -> int:
    """Executes the list-models command."""
    from qbank.llm import QbOpenAIClient, normalize_model_name
    print("\n" + "=" * 65)
    print("           DANH SÁCH MODEL KHẢ DỤNG CHO API KEY")
    print("=" * 65)
    print(f"Base URL:       {qbank_config.llm_base_url}")
    print(f"Model chính:    {qbank_config.llm_model}")
    print(f"Model dự phòng: {qbank_config.llm_fallback_models or '(Không cấu hình)'}")
    print("-" * 65)
    try:
        client = QbOpenAIClient()
        models = client.list_models()
        if not models:
            print("Không tìm thấy model nào từ API.")
            return 0

        # Filtering logic
        text_only = not getattr(args, "all", False)
        exclude_keywords = [
            "embedding", "tts", "image", "live", "veo", "lyria",
            "robotics", "computer-use", "transcribe", "translate",
            "aqa", "deep-research", "antigravity"
        ]

        norm_primary = normalize_model_name(qbank_config.llm_model)
        norm_fallbacks = [normalize_model_name(m) for m in qbank_config.fallback_models]
        norm_available_map = {normalize_model_name(m): m for m in models}

        if text_only:
            displayed_models = [
                m for m in models
                if not any(kw in normalize_model_name(m).lower() for kw in exclude_keywords)
            ]
            print(f"Tìm thấy {len(displayed_models)}/{len(models)} model dạng văn bản/chat (--text-only):")
            print("(Lọc theo tên hiển thị: ẩn các model embedding, tts, image, live...)")
            print("GHI CHÚ: Đây là bộ lọc theo tên, không phải theo khả năng thật của model. Dùng cờ --all để xem đủ.")
        else:
            displayed_models = models
            print(f"Tìm thấy {len(displayed_models)} model khả dụng (--all):")

        print("-" * 65)
        for idx, m_id in enumerate(displayed_models, 1):
            norm_id = normalize_model_name(m_id)
            marker = ""
            if norm_id == norm_primary:
                marker = " [MODEL CHÍNH]"
            elif norm_id in norm_fallbacks:
                marker = " [DỰ PHÒNG]"
            print(f"  {idx:>2}. {m_id}{marker}")

        # Warn if configured models in .env are not available (comparing normalized names)
        print("-" * 65)
        if norm_primary and norm_primary not in norm_available_map:
            print(f"[CẢNH BÁO] Model chính '{qbank_config.llm_model}' trong .env KHÔNG có trong danh sách model khả dụng!")
        for fm in qbank_config.fallback_models:
            if fm and normalize_model_name(fm) not in norm_available_map:
                print(f"[CẢNH BÁO] Model dự phòng '{fm}' trong .env KHÔNG có trong danh sách model khả dụng!")

        print("=" * 65)
        return 0
    except Exception as e:
        print(f"\n[LỖI] Không thể lấy danh sách model: {e}", file=sys.stderr)
        print("=" * 65)
        return 1


def _print_probe_result(res: Dict[str, Any], indent: str = "    ") -> None:
    status_str = f"HTTP {res['status_code']}" if res.get("status_code") is not None else "Lỗi kết nối"
    lat_str = f"{res['latency_ms']:.0f} ms"
    print(f"{indent}* Trạng thái:     {status_str} (Thời gian phản hồi: {lat_str})")
    if res.get("ok"):
        finish = res.get("finish_reason") or "n/a"
        p_tok = res.get("prompt_tokens", 0)
        c_tok = res.get("completion_tokens", 0)
        r_tok = res.get("reasoning_tokens")
        t_tok = res.get("total_tokens", 0)
        r_str = f", Reasoning: {r_tok}" if r_tok is not None else ""
        print(f"{indent}* Finish reason:  {finish}")
        print(f"{indent}* Token usage:    Prompt: {p_tok}, Completion: {c_tok}{r_str}, Total: {t_tok}")
        print(f"{indent}* Kết quả:        THÀNH CÔNG (Model phản hồi hợp lệ)")
    else:
        err_type = res.get("error_type") or "Lỗi không xác định"
        err_msg = res.get("error_message") or ""
        print(f"{indent}* Phân loại lỗi:  {err_type}")
        print(f"{indent}* Thông báo lỗi:  {err_msg}")


def handle_probe_model(args: argparse.Namespace) -> int:
    """Executes the probe-model command."""
    from qbank.llm import QbOpenAIClient, normalize_model_name
    print("\n" + "=" * 65)
    print("             KIỂM TRA MODEL LLM (PROBE-MODEL)")
    print("=" * 65)
    print(f"Base URL:         {qbank_config.llm_base_url}")
    print(f"API Key:          [ĐÃ BẢO VỆ / CHE GIẤU]")
    print(f"Reasoning effort: {qbank_config.llm_reasoning_effort or '(none)'}")
    print("\n[LƯU Ý QUAN TRỌNG] Mỗi lần probe tốn 1 lượt hạn mức API của tài khoản!")
    print("-" * 65)

    client = QbOpenAIClient()
    if not client.api_key:
        print("\n[LỖI] QBANK_LLM_API_KEY chưa được thiết lập trong .env.", file=sys.stderr)
        return 1

    # Determine target models
    if args.models:
        target_models = args.models
    else:
        target_models = []
        if qbank_config.llm_model:
            target_models.append(qbank_config.llm_model)
        for fm in qbank_config.fallback_models:
            if fm and fm not in target_models:
                target_models.append(fm)

    if not target_models:
        print("\n[LỖI] Không có model nào được chỉ định và cấu hình không có model.", file=sys.stderr)
        return 1

    configured_effort = qbank_config.llm_reasoning_effort or None

    for idx, model_name in enumerate(target_models, 1):
        print(f"\n[{idx}/{len(target_models)}] Đang probe model: '{model_name}'...")

        effort_label = f"'{configured_effort}'" if configured_effort else "(không truyền)"
        print(f"  --> Thử nghiệm 1 (reasoning_effort={effort_label}):")
        res1 = client.probe_model(model_name, reasoning_effort=configured_effort)
        _print_probe_result(res1, indent="      ")

        # Nếu lỗi 400 và đang có reasoning_effort, thử thêm MỘT lần không có tham số này
        if not res1["ok"] and res1.get("status_code") == 400 and configured_effort:
            print(f"  --> Thử nghiệm 2 (thử lại KHÔNG CÓ tham số reasoning_effort):")
            res2 = client.probe_model(model_name, reasoning_effort=None)
            _print_probe_result(res2, indent="      ")

            if res2["ok"]:
                print("      => KẾT LUẬN: Model phản hồi tốt khi KHÔNG có reasoning_effort.")
                print(f"         (Model '{model_name}' không hỗ trợ tham số reasoning_effort={effort_label}).")
            else:
                print(f"      => KẾT LUẬN: Model vẫn thất bại khi bỏ reasoning_effort (HTTP {res2.get('status_code')}).")

    print("\n" + "=" * 65)
    print("                     KẾT THÚC PROBE")
    print("=" * 65)
    return 0


def handle_blueprint(args: argparse.Namespace) -> int:
    """Executes the blueprint command to inspect HSK exam blueprints."""
    from qbank.blueprint import load_blueprint, load_blueprint_raw, list_blueprints, get_section_blueprint

    if args.level is None:
        levels = list_blueprints()
        if not levels:
            print("Không tìm thấy blueprint nào trong thư mục data/qbank/blueprint/.")
            return 0

        print("\n" + "=" * 60)
        print("          DANH SÁCH BLUEPRINT ĐỀ THI HSK 3.0 CHUẨN")
        print("=" * 60)
        for lvl in levels:
            try:
                bp = load_blueprint(lvl)
                tot_q = sum(sum(p.n_questions for p in s.parts.values()) for s in bp.sections.values())
                sec_names = [f"{k} ({s.name})" for k, s in bp.sections.items()]
                v_str = "[VERIFIED]" if bp.verified else "[UNVERIFIED]"
                print(f"HSK {lvl} {v_str}: {tot_q} câu, {getattr(bp, 'total_time_min', '?')} phút | Phần thi: {', '.join(sec_names)}")
            except Exception as e:
                print(f"HSK {lvl}: Lỗi đọc blueprint ({e})")
        print("=" * 60)
        print("Dùng 'python -m qbank.cli blueprint --level <N>' để xem chi tiết.")
        return 0

    try:
        if args.section:
            sec_bp = get_section_blueprint(args.level, args.section)
            if args.json:
                print(json.dumps(sec_bp.model_dump(), ensure_ascii=False, indent=2))
                return 0

            print("\n" + "=" * 60)
            print(f"     CHI TIẾT PHẦN THI '{args.section.upper()}' - HSK {args.level}")
            print("=" * 60)
            print(f"Tên phần:         {sec_bp.name}")
            tot_sec_q = sum(p.n_questions for p in sec_bp.parts.values())
            print(f"Tổng số câu hỏi:  {tot_sec_q} câu")
            print("\nCác phần nhỏ (parts):")
            for p_key, p_spec in sec_bp.parts.items():
                desc = getattr(p_spec, 'description', '')
                d_str = f" - {desc}" if desc else ""
                print(f"  • {p_key} ({p_spec.type}): {p_spec.n_questions} câu, {p_spec.n_options} lựa chọn, {p_spec.time_min} phút{d_str}")
            print("=" * 60)
            return 0

        if args.json:
            print(json.dumps(load_blueprint_raw(args.level), ensure_ascii=False, indent=2))
            return 0

        bp = load_blueprint(args.level)

        tot_q = sum(sum(p.n_questions for p in s.parts.values()) for s in bp.sections.values())
        print("\n" + "=" * 60)
        print(f"            BLUEPRINT ĐỀ THI HSK {args.level} (CHUẨN 3.0)")
        print("=" * 60)
        print(f"Cấp độ:          HSK {args.level}")
        print(f"Trạng thái:      {'Đã kiểm chứng (verified: True)' if bp.verified else 'Chưa kiểm chứng (verified: False)'}")
        print(f"Tổng số câu:     {tot_q} câu")
        print(f"Tổng thời gian:  {getattr(bp, 'total_time_min', '?')} phút")
        if hasattr(bp, 'max_score'):
            print(f"Thang điểm:      {getattr(bp, 'max_score')} điểm (Điểm đạt: {getattr(bp, 'passing_score', '?')} điểm)")
        if hasattr(bp, 'has_pinyin'):
            print(f"Phiên âm pinyin: {'Có đầy đủ' if getattr(bp, 'has_pinyin') else 'Không (chỉ chữ Hán)'}")
        if hasattr(bp, 'audio_playback'):
            print(f"Số lần nghe:     {getattr(bp, 'audio_playback')} lần")

        print("\nCÁC PHẦN THI (SECTIONS):")
        for s_idx, (s_key, s_val) in enumerate(bp.sections.items(), 1):
            s_q = sum(p.n_questions for p in s_val.parts.values())
            s_time = getattr(s_val, 'time_min', sum(p.time_min for p in s_val.parts.values()))
            print(f"\n{s_idx}. {s_val.name} [{s_key}]: {s_q} câu, ~{s_time} phút")
            for p_key, p_spec in s_val.parts.items():
                p_desc = getattr(p_spec, 'description', '')
                d_line = f"\n     Ghi chú: {p_desc}" if p_desc else ""
                print(f"   - {p_key} ({p_spec.type}): {p_spec.n_questions} câu | {p_spec.n_options} lựa chọn | {p_spec.time_min} phút{d_line}")
        print("=" * 60)
        return 0
    except Exception as e:
        print(f"\n[LỖI] Không thể đọc blueprint HSK {args.level}: {e}", file=sys.stderr)
        return 1


def main() -> int:
    parser = build_parser()
    if len(sys.argv) == 1:
        parser.print_help()
        return 0

    args = parser.parse_args()
    if args.command == "generate":
        return handle_generate(args)
    elif args.command == "review":
        return handle_review(args)
    elif args.command == "stats":
        return handle_stats(args)
    elif args.command == "syllabus-check":
        return handle_syllabus_check(args)
    elif args.command == "sync":
        return handle_sync(args)
    elif args.command == "retire":
        return handle_retire(args)
    elif args.command == "export-approved":
        return handle_export_approved(args)
    elif args.command == "import-approved":
        return handle_import_approved(args)
    elif args.command == "import-vocab":
        return handle_import_vocab(args)
    elif args.command == "list-models":
        return handle_list_models(args)
    elif args.command == "probe-model":
        return handle_probe_model(args)
    elif args.command == "set-status":
        return handle_set_status(args)
    elif args.command == "recheck":
        return handle_recheck(args)
    elif args.command == "blueprint":
        return handle_blueprint(args)
    else:
        parser.print_help()
        return 0


if __name__ == "__main__":
    sys.exit(main())

