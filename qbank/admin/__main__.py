import os
import sys
import socket
import argparse
from qbank.admin.app import create_app


def is_port_in_use(host: str, port: int) -> bool:
    """Checks whether the given TCP port is already occupied on the host."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind((host, port))
            return False
        except OSError:
            return True


def main():
    parser = argparse.ArgumentParser(
        prog="python -m qbank.admin",
        description="Giao diện Web Quản trị cục bộ QBank HSK 3.0 (Chỉ chạy trên 127.0.0.1)"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=None,
        help="Cổng dịch vụ web nội bộ (mặc định lấy từ QBANK_ADMIN_PORT hoặc 8080)"
    )
    args = parser.parse_args()

    port = args.port
    if port is None:
        try:
            port = int(os.getenv("QBANK_ADMIN_PORT", "8080"))
        except ValueError:
            port = 8080

    host = "127.0.0.1"

    # STRICT REQUIREMENT 1: Check if port is occupied. If yes, report error clearly, do NOT change port automatically.
    if is_port_in_use(host, port):
        print(f"\n[LỖI KHỞI ĐỘNG] Cổng {port} tại địa chỉ {host} đang bận (đã bị tiến trình khác chiếm dụng).", file=sys.stderr)
        print("Hệ thống sẽ KHÔNG tự động chuyển sang cổng khác để đảm bảo an toàn.", file=sys.stderr)
        print(f"Vui lòng giải phóng cổng {port} hoặc cấu hình cổng khác qua tham số: --port <cổng> hoặc biến môi trường QBANK_ADMIN_PORT.\n", file=sys.stderr)
        sys.exit(1)

    app = create_app(port=port)

    print("\n" + "=" * 65)
    print("      QBANK HSK 3.0 - TRANG QUẢN TRỊ CỤC BỘ (LOCAL ADMIN)")
    print("=" * 65)
    print(f"- Địa chỉ bind:       http://{host}:{port}")
    print(f"- Cổng hoạt động:     {port}")
    print("- Chế độ bảo mật:     Chỉ chấp nhận kết nối từ 127.0.0.1 / localhost")
    print("- CSRF Protection:    BẬT (Strict token validation)")
    print("- Debug mode:         TẮT (debug=False, không reloader)")
    print("=" * 65)
    print(f"Mở trình duyệt truy cập: http://{host}:{port}\n")

    # Run strictly bound to 127.0.0.1 without reloader or debug
    app.run(
        host=host,
        port=port,
        debug=False,
        use_reloader=False
    )


if __name__ == "__main__":
    main()
