import os
import re
import secrets
import hmac
from typing import Optional
from flask import Flask, request, session, abort, render_template, jsonify


def sanitize_text(text: str) -> str:
    """Strips sensitive information such as API keys and DATABASE_URL."""
    if not text:
        return text
    # Mask database connection strings
    text = re.sub(r"postgres(?:ql)?://[^\s\"']+", "[REDACTED_DATABASE_URL]", text)
    # Mask API key if set
    api_key = os.getenv("QBANK_LLM_API_KEY")
    if api_key and len(api_key) > 5:
        text = text.replace(api_key, "[REDACTED_API_KEY]")
    return text


def create_app(port: Optional[int] = None) -> Flask:
    if port is None:
        try:
            port = int(os.getenv("QBANK_ADMIN_PORT", "8080"))
        except ValueError:
            port = 8080

    template_dir = os.path.join(os.path.dirname(__file__), "templates")
    app = Flask(__name__, template_folder=template_dir)

    # Security configuration
    # 1. Random secret key generated on each startup - never hardcoded
    app.secret_key = secrets.token_hex(32)

    # 2. Secure session cookies
    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Strict",
        SESSION_COOKIE_SECURE=False,  # Running on local HTTP 127.0.0.1
        MAX_CONTENT_LENGTH=15 * 1024 * 1024,  # Max 15MB file upload
        ADMIN_PORT=port,
        DEBUG=False,
    )

    allowed_hosts = {
        f"127.0.0.1:{port}".lower(),
        f"localhost:{port}".lower(),
        "127.0.0.1",
        "localhost",
    }

    @app.before_request
    def security_guard():
        # Check Remote IP: Must only be loopback
        remote = request.remote_addr
        if remote not in ("127.0.0.1", "::1", "localhost", None):
            abort(403)

        # Check Host header
        host = request.host.lower()
        if host not in allowed_hosts:
            abort(403)

        # Initialize CSRF token in session
        if "csrf_token" not in session:
            session["csrf_token"] = secrets.token_hex(32)

        # For state-modifying requests (POST, PUT, DELETE, PATCH)
        if request.method in ("POST", "PUT", "DELETE", "PATCH"):
            # Check Origin and Referer headers if provided
            valid_origins = (f"http://127.0.0.1:{port}", f"http://localhost:{port}")
            origin = request.headers.get("Origin")
            referer = request.headers.get("Referer")

            if origin and not any(origin.startswith(vo) for vo in valid_origins):
                abort(403)
            if referer and not any(referer.startswith(vo) for vo in valid_origins):
                abort(403)

            # Check CSRF token
            submitted_token = request.form.get("csrf_token") or request.headers.get("X-CSRFToken")
            expected_token = session.get("csrf_token")
            if not submitted_token or not expected_token or not hmac.compare_digest(submitted_token, expected_token):
                abort(403)

    @app.context_processor
    def inject_globals():
        return {
            "csrf_token": session.get("csrf_token", ""),
            "admin_port": app.config.get("ADMIN_PORT", 8080),
        }

    @app.errorhandler(403)
    def forbidden(e):
        return render_template("error.html", code=403, title="Truy cập bị từ chối", message="Yêu cầu bị từ chối do bảo mật (chỉ cho phép 127.0.0.1/localhost và token CSRF hợp lệ)."), 403

    @app.errorhandler(404)
    def not_found(e):
        return render_template("error.html", code=404, title="Không tìm thấy trang", message="Đường dẫn không tồn tại trên hệ thống quản trị."), 404

    @app.errorhandler(413)
    def file_too_large(e):
        return render_template("error.html", code=413, title="File quá lớn", message="Dung lượng file tải lên vượt quá giới hạn 15MB."), 413

    @app.errorhandler(500)
    def internal_error(e):
        # Do not leak tracebacks or credentials
        safe_msg = sanitize_text(str(e))
        return render_template("error.html", code=500, title="Lỗi hệ thống nội bộ", message=f"Đã xảy ra lỗi xử lý: {safe_msg}"), 500

    # Register routes
    from qbank.admin.routes import register_routes
    register_routes(app)

    return app
