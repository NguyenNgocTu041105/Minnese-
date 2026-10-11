import os
import sys
import argparse
from typing import Optional, List

# Reconfigure stdout/stderr for Unicode (Vietnamese & Chinese) compatibility on Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from qbank.config import qbank_config

from qbank.store import get_store
from qbank.generator import QbGenerator
from qbank.syllabus import get_syllabus


def handle_generate(args: argparse.Namespace) -> int:
    """Executes the generate command."""
    print(f"\n[QBank Generator] Bắt đầu sinh câu hỏi HSK {args.level}...")
    print(f"- Loại câu hỏi: {args.part}")
    print(f"- Số lượng yêu cầu: {args.n}")
    print(f"- Solver verification: {'Bật' if args.solver else 'Tắt'}")
    print(f"- Chế độ: {'DRY-RUN (Không lưu vào DB)' if args.dry_run else 'Thực thi (Lưu vào DB)'}")

    generator = QbGenerator()
    try:
        summary = generator.generate(
            level=args.level,
            part_type=args.part,
            count=args.n,
            use_solver=args.solver,
            dry_run=args.dry_run
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
    print(f"Tổng câu sinh ra:          {summary.questions_generated}")
    print(f"Câu đạt tiêu chuẩn lưu:    {summary.questions_saved}")
    print(f"  - Tự động duyệt (đạt):   {summary.approved_count}")
    print(f"  - Cần người xem xét:     {summary.needs_review_count}")
    print(f"Câu bị loại bỏ:            {summary.rejected_validation_count + summary.duplicate_count}")

    if summary.rejected_by_reason:
        print("Chi tiết lý do loại bỏ:")
        for reason, cnt in summary.rejected_by_reason.items():
            print(f"  - {reason}: {cnt} câu")

    if summary.stopped_reason:
        print(f"Lý do dừng sớm:            {summary.stopped_reason}")
    print("=" * 60)

    # In chi tiết các câu đã sinh
    if summary.generated_questions:
        print(f"\nChi tiết {len(summary.generated_questions)} câu hỏi:")
        for idx, q in enumerate(summary.generated_questions, 1):
            opts_str = " | ".join([f"{chr(65 + i)}. {opt}" for i, opt in enumerate(q.options)])
            correct_opt = f"{chr(65 + q.answer_index)}. {q.options[q.answer_index]}"
            status_tag = f"[{q.status.upper()}]"
            print(f"\n{idx}. {status_tag} ID: {q.question_id}")
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


def handle_review(args: argparse.Namespace) -> int:
    """Executes the interactive review command."""
    store = get_store()
    questions = store.list_questions(
        status="needs_review",
        level=args.level,
        limit=args.limit
    )

    if not questions:
        lvl_str = f" HSK {args.level}" if args.level else ""
        print(f"\nKhông có câu hỏi nào cần duyệt (needs_review){lvl_str}.")
        return 0

    total = len(questions)
    print(f"\n[QBank Review] Tìm thấy {total} câu hỏi cần duyệt.")
    print("Nhập [a]pprove (duyệt), [r]eject (từ chối), [s]kip (bỏ qua), hoặc [q]uit (thoát).\n")

    approved_count = 0
    rejected_count = 0
    skipped_count = 0

    for idx, q in enumerate(questions, 1):
        print("=" * 70)
        print(f"[{idx}/{total}] ID: {q.question_id} | Level: HSK {q.level} | Dạng: {q.part_type}")
        if q.passage:
            print(f"Đoạn văn:\n  {q.passage}")
        print(f"Câu dẫn (Stem):\n  {q.stem}")
        print("Phương án lựa chọn:")
        for i, opt in enumerate(q.options):
            marker = " (ĐÁP ÁN ĐÚNG)" if i == q.answer_index else ""
            print(f"  [{i}] {chr(65 + i)}. {opt}{marker}")
        print(f"Giải thích (VI):\n  {q.explanation_vi}")
        print("Đánh giá QA:")
        print(f"  - Cấu trúc: {'OK' if q.qa.structure_ok else 'LỖI'}")
        print(f"  - Cấp độ từ vựng: {'OK' if q.qa.level_ok else 'NGOÀI CẤP'}")
        if q.qa.out_of_level_words:
            print(f"  - Từ ngoài cấp: {', '.join(q.qa.out_of_level_words)}")
        if q.qa.notes:
            print(f"  - Ghi chú: {'; '.join(q.qa.notes)}")
        print("=" * 70)

        # Interactive loop
        while True:
            try:
                choice = input("Hành động: [a]pprove / [r]eject / [s]kip / [q]uit > ").strip().lower()
            except (EOFError, KeyboardInterrupt):
                print("\nĐã hủy quá trình duyệt.")
                return 0

            if choice in ("a", "approve"):
                store.update_status(q.question_id, "approved")
                approved_count += 1
                print("✓ Đã duyệt (status='approved').\n")
                break
            elif choice in ("r", "reject"):
                store.update_status(q.question_id, "rejected")
                rejected_count += 1
                print("✗ Đã từ chối (status='rejected').\n")
                break
            elif choice in ("s", "skip", ""):
                skipped_count += 1
                print("- Đã bỏ qua.\n")
                break
            elif choice in ("q", "quit", "exit"):
                print("\nĐã dừng quá trình duyệt.")
                _print_review_summary(approved_count, rejected_count, skipped_count, total)
                return 0
            else:
                print("Lựa chọn không hợp lệ. Vui lòng nhập 'a', 'r', 's', hoặc 'q'.")

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


def handle_stats(args: argparse.Namespace) -> int:
    """Executes the stats command."""
    store = get_store()
    stats = store.get_stats()

    print("\n" + "=" * 55)
    print("             THỐNG KÊ KHO CÂU HỎI QBANK")
    print("=" * 55)
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

    print(f"\nSố câu học viên báo lỗi:   {stats.get('reported_questions', 0)}")
    print("=" * 55)
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
    gen_parser.add_argument("--part", type=str, default="fill_blank", choices=["fill_blank", "reading_part1", "reading_comprehension"], help="Dạng bài")
    gen_parser.add_argument("--n", type=int, default=5, help="Số lượng câu hỏi muốn sinh")
    gen_parser.add_argument("--dry-run", action="store_true", default=False, help="Chạy thử nghiệm, in kết quả không lưu vào DB")
    gen_parser.add_argument("--solver", dest="solver", action="store_true", default=True, help="Bật kiểm tra đối soát bằng LLM solver (mặc định)")
    gen_parser.add_argument("--no-solver", dest="solver", action="store_false", help="Tắt kiểm tra đối soát bằng LLM solver")

    # 2. review
    rev_parser = subparsers.add_parser("review", help="Duyệt câu hỏi đang chờ xem xét (needs_review)")
    rev_parser.add_argument("--level", type=int, choices=range(1, 7), default=None, help="Lọc theo cấp độ HSK")
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
    vocab_parser.add_argument("--execute", action="store_true", default=False, help="Thực thi ghi thật vào vocab.jsonl (mặc định: dry-run xem trước)")
    vocab_parser.add_argument("--target-vocab-path", type=str, default=None, help=argparse.SUPPRESS)
    vocab_parser.add_argument("--rejected-csv-path", type=str, default=None, help=argparse.SUPPRESS)

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
    print(f"- Số câu bỏ qua:              {res.skipped_duplicate_hash + res.skipped_near_duplicate}")
    if res.skipped_duplicate_hash > 0:
        print(f"  * Lý do trùng content_hash:   {res.skipped_duplicate_hash}")
    if res.skipped_near_duplicate > 0:
        print(f"  * Lý do nghi trùng 4-gram:    {res.skipped_near_duplicate}")
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
    print(f"- Tổng số từ hợp lệ:          {len(summary.valid_items)}")
    for lvl in range(1, 7):
        cnt = summary.by_level.get(lvl, 0)
        print(f"  * HSK {lvl}: {cnt:>5} từ")

    print("\n" + "-" * 40)
    print("         THỐNG KÊ DÒNG BỊ LOẠI")
    print("-" * 40)
    print(f"- Tổng số dòng bị loại:       {len(summary.rejected_rows)}")
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
    else:
        parser.print_help()
        return 0


if __name__ == "__main__":
    sys.exit(main())

