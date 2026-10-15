import os
import tempfile
import threading
import json
from typing import Dict, Any, Optional
from werkzeug.utils import secure_filename
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session

from qbank.store import get_store
from qbank.syllabus import get_syllabus
from qbank.generator import QbGenerator
from qbank.bridge import QbBridge, check_postgres_available
from qbank.vocab_importer import QbVocabImporter
from qbank.admin.app import sanitize_text


class GenerationTaskManager:
    """Manages single-threaded background question generation with progress tracking."""
    def __init__(self):
        self._lock = threading.Lock()
        self._is_running = False
        self._progress = {
            "status": "idle",
            "percent": 0,
            "message": "Sẵn sàng",
            "summary": None,
            "error": None
        }

    def is_running(self) -> bool:
        return self._is_running

    def get_progress(self) -> Dict[str, Any]:
        return dict(self._progress)

    def start_job(self, level: int, count: int, solver: bool) -> bool:
        with self._lock:
            if self._is_running:
                return False
            self._is_running = True
            self._progress = {
                "status": "running",
                "percent": 10,
                "message": f"Bắt đầu sinh {count} câu hỏi HSK {level}...",
                "summary": None,
                "error": None
            }

        thread = threading.Thread(
            target=self._run_job,
            args=(level, count, solver),
            daemon=True
        )
        thread.start()
        return True

    def _run_job(self, level: int, count: int, solver: bool):
        try:
            generator = QbGenerator()
            self._progress["percent"] = 40
            self._progress["message"] = "Đang gọi mô hình LLM và đối soát..."
            summary = generator.generate(
                level=level,
                part_type="fill_blank",
                count=count,
                use_solver=solver,
                dry_run=False
            )
            self._progress["percent"] = 100
            self._progress["status"] = "completed"
            self._progress["message"] = f"Hoàn thành: sinh {summary.questions_saved} câu đạt chuẩn (Duyệt: {summary.approved_count}, Cần xem xét: {summary.needs_review_count})"
            self._progress["summary"] = {
                "batch_id": summary.batch_id,
                "requested": summary.requested_count,
                "saved": summary.questions_saved,
                "approved": summary.approved_count,
                "needs_review": summary.needs_review_count,
                "rejected": summary.rejected_validation_count + summary.duplicate_count,
                "stopped_reason": summary.stopped_reason
            }
        except Exception as e:
            self._progress["status"] = "error"
            self._progress["error"] = sanitize_text(str(e))
            self._progress["message"] = f"Lỗi: {sanitize_text(str(e))}"
        finally:
            self._is_running = False


gen_task_manager = GenerationTaskManager()
sync_lock = threading.Lock()


def register_routes(app: Flask):

    @app.route("/")
    def dashboard():
        store = get_store()
        stats = store.get_stats()
        syllabus = get_syllabus()
        syll_stats = syllabus.get_stats()

        # Check if syllabus is using sample fallback
        is_sample_syllabus = "vocab.sample.jsonl" in os.path.basename(syllabus.vocab_file_path)

        return render_template(
            "dashboard.html",
            stats=stats,
            syll_stats=syll_stats,
            is_sample_syllabus=is_sample_syllabus,
            vocab_file=syllabus.vocab_file_path
        )

    # -------------------------------------------------------------
    # Màn hình a: Nạp từ vựng (Vocab Import)
    # -------------------------------------------------------------
    @app.route("/vocab", methods=["GET", "POST"])
    def vocab_import():
        if request.method == "GET":
            # Clear preview if navigating fresh
            if request.args.get("clear"):
                session.pop("vocab_preview", None)
            preview = session.get("vocab_preview")
            return render_template("vocab.html", preview=preview)

        # POST action
        action = request.form.get("action", "preview")
        source = request.form.get("source", "").strip()
        license_status = request.form.get("license_status", "").strip()
        level_raw = request.form.get("level", "").strip()
        default_level = int(level_raw) if level_raw.isdigit() else None
        column_map = request.form.get("column_map", "").strip() or None
        sheet_name = request.form.get("sheet_name", "").strip() or None
        mode = request.form.get("mode", "merge").strip().lower()

        if not source:
            flash("Bắt buộc phải nhập tên nguồn tài liệu (--source).", "danger")
            return redirect(url_for("vocab_import"))

        if not license_status or license_status not in ("official", "permitted", "self-authored"):
            flash("Bắt buộc phải chọn trạng thái bản quyền (--license-status) hợp lệ.", "danger")
            return redirect(url_for("vocab_import"))

        if action == "execute":
            # Confirmation to execute writing
            stored_file_path = session.get("vocab_temp_file")
            if not stored_file_path or not os.path.exists(stored_file_path):
                flash("File tạm đã hết hạn hoặc không tồn tại. Vui lòng tải lên lại.", "warning")
                return redirect(url_for("vocab_import"))

            try:
                importer = QbVocabImporter(
                    file_path=stored_file_path,
                    source=source,
                    license_status=license_status,
                    default_level=default_level,
                    column_map=column_map,
                    sheet_name=sheet_name,
                    mode=mode
                )
                summary = importer.process(execute=True)
                flash(f"Thực thi thành công! Đã lưu {summary.saved_count} từ vào vocab.jsonl (sao lưu tại {os.path.basename(summary.backup_file or '')}).", "success")
                session.pop("vocab_preview", None)
                session.pop("vocab_temp_file", None)
            except Exception as e:
                flash(f"Lỗi khi thực thi ghi từ vựng: {sanitize_text(str(e))}", "danger")
            finally:
                if stored_file_path and os.path.exists(stored_file_path):
                    try:
                        os.remove(stored_file_path)
                    except OSError:
                        pass
            return redirect(url_for("vocab_import"))

        # Action: Preview (Dry-Run)
        file = request.files.get("file")
        if not file or not file.filename:
            flash("Vui lòng chọn hoặc kéo thả file từ vựng nguồn.", "danger")
            return redirect(url_for("vocab_import"))

        filename = secure_filename(file.filename)
        ext = os.path.splitext(filename)[1].lower()
        if ext not in (".csv", ".tsv", ".xlsx", ".pdf"):
            flash("Định dạng file không được hỗ trợ. Vui lòng dùng CSV, TSV, XLSX hoặc PDF.", "danger")
            return redirect(url_for("vocab_import"))

        # Save to temporary file
        fd, temp_path = tempfile.mkstemp(suffix=ext, prefix="qbank_vocab_")
        os.close(fd)
        try:
            file.save(temp_path)
            importer = QbVocabImporter(
                file_path=temp_path,
                source=source,
                license_status=license_status,
                default_level=default_level,
                column_map=column_map,
                sheet_name=sheet_name,
                mode=mode
            )
            summary = importer.process(execute=False)

            session["vocab_temp_file"] = temp_path
            session["vocab_preview"] = {
                "source": source,
                "license_status": license_status,
                "default_level": default_level,
                "column_map": column_map,
                "sheet_name": sheet_name,
                "mode": mode,
                "total_rows": summary.total_raw_rows,
                "valid_count": len(summary.valid_items),
                "by_level": summary.by_level,
                "rejected_count": len(summary.rejected_rows),
                "rejected_by_reason": summary.rejected_by_reason,
                "first_10": [
                    {"word": it.word, "pinyin": it.pinyin, "pos": it.pos, "level": it.level}
                    for it in summary.valid_items[:10]
                ],
                "warnings": summary.warnings[:10]
            }
            flash(f"Đã xem trước {len(summary.valid_items)} từ hợp lệ ({len(summary.rejected_rows)} dòng bị loại).", "info")
        except Exception as e:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except OSError:
                    pass
            flash(f"Lỗi khi đọc file từ vựng: {sanitize_text(str(e))}", "danger")

        return redirect(url_for("vocab_import"))

    # -------------------------------------------------------------
    # Màn hình b: Sinh đề (Question Generator)
    # -------------------------------------------------------------
    @app.route("/generate", methods=["GET", "POST"])
    def generate_view():
        syllabus = get_syllabus()
        is_sample = "vocab.sample.jsonl" in os.path.basename(syllabus.vocab_file_path)

        if request.method == "POST":
            if gen_task_manager.is_running():
                flash("Hệ thống đang bận thực hiện tác vụ sinh đề khác. Vui lòng chờ.", "warning")
                return redirect(url_for("generate_view"))

            level = int(request.form.get("level", 1))
            count = int(request.form.get("count", 5))
            count = max(1, min(count, 50))
            solver = request.form.get("solver") == "on"

            started = gen_task_manager.start_job(level=level, count=count, solver=solver)
            if started:
                flash(f"Đã bắt đầu tác vụ sinh {count} câu hỏi HSK {level} ở chế độ nền.", "info")
            else:
                flash("Không thể bắt đầu tác vụ (hệ thống đang bận).", "warning")
            return redirect(url_for("generate_view"))

        return render_template(
            "generate.html",
            is_sample=is_sample,
            progress=gen_task_manager.get_progress(),
            is_running=gen_task_manager.is_running()
        )

    @app.route("/generate/status")
    def generate_status():
        return jsonify(gen_task_manager.get_progress())

    # -------------------------------------------------------------
    # Màn hình c: Duyệt câu hỏi (Human Review)
    # -------------------------------------------------------------
    @app.route("/review", methods=["GET", "POST"])
    def review_view():
        store = get_store()

        if request.method == "POST":
            qid = request.form.get("question_id")
            action = request.form.get("action")  # approve, reject, skip

            if action == "approve":
                store.update_status(qid, "approved")
                flash(f"Đã duyệt câu hỏi {qid} (status='approved').", "success")
            elif action == "reject":
                store.update_status(qid, "rejected")
                flash(f"Đã từ chối câu hỏi {qid} (status='rejected').", "warning")
            elif action == "skip":
                flash(f"Đã bỏ qua câu hỏi {qid}.", "info")

            return redirect(request.referrer or url_for("review_view"))

        level_filter = request.args.get("level")
        level_int = int(level_filter) if level_filter and level_filter.isdigit() else None
        questions = store.list_questions(status="needs_review", level=level_int, limit=50)

        return render_template(
            "review.html",
            questions=questions,
            current_level=level_int,
            count=len(questions)
        )

    # -------------------------------------------------------------
    # Màn hình d: Đồng bộ & Retire (Bridge Sync)
    # -------------------------------------------------------------
    @app.route("/sync", methods=["GET", "POST"])
    def sync_view():
        store = get_store()
        bridge = QbBridge(store=store)
        is_pg = check_postgres_available()

        if request.method == "POST":
            action = request.form.get("action")

            if action == "sync_execute":
                with sync_lock:
                    confirm_count = request.form.get("confirm_count", "").strip()
                    expected_count = request.form.get("expected_count", "").strip()
                    confirm_pg = request.form.get("confirm_pg") == "on"

                    if confirm_count != expected_count:
                        flash(f"Xác nhận số lượng không khớp (nhập: '{confirm_count}', yêu cầu: '{expected_count}'). Hủy thao tác.", "danger")
                        return redirect(url_for("sync_view"))

                    try:
                        res = bridge.sync(
                            execute=True,
                            confirmed_postgres_backup=confirm_pg
                        )
                        flash(f"Đã đồng bộ thành công {res.synced_count} câu hỏi sang DB cũ!", "success")
                    except Exception as e:
                        flash(f"Đồng bộ thất bại: {sanitize_text(str(e))}", "danger")
                return redirect(url_for("sync_view"))

            elif action == "retire_execute":
                with sync_lock:
                    batch_id = request.form.get("batch_id", "").strip()
                    confirm_retire = request.form.get("confirm_retire") == "on"

                    if not batch_id or not confirm_retire:
                        flash("Vui lòng nhập Batch ID và tick xác nhận để vô hiệu hóa.", "danger")
                        return redirect(url_for("sync_view"))

                    try:
                        cnt = bridge.retire(batch_id=batch_id)
                        flash(f"Đã vô hiệu hóa thành công {cnt} câu hỏi thuộc batch '{batch_id}'.", "warning")
                    except Exception as e:
                        flash(f"Vô hiệu hóa thất bại: {sanitize_text(str(e))}", "danger")
                return redirect(url_for("sync_view"))

        # GET request: Dry-run preview
        dry_res = None
        try:
            dry_res = bridge.sync(execute=False)
        except Exception as e:
            flash(f"Không thể kiểm tra đồng bộ: {sanitize_text(str(e))}", "warning")

        return render_template(
            "sync.html",
            dry_res=dry_res,
            is_postgres=is_pg
        )
