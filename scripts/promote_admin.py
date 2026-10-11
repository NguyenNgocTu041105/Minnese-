"""
CLI Script nâng quyền Admin cho tài khoản giáo viên/quản trị viên.
Sử dụng:
    python scripts/promote_admin.py --email "teacher@center.edu.vn"
"""
import sys
import argparse
from db.connection import get_db_cursor

def main():
    parser = argparse.ArgumentParser(description="Nâng cấp quyền Admin cho học viên/giáo viên")
    parser.add_argument("--email", type=str, required=True, help="Email đăng nhập Firebase của tài khoản")
    args = parser.parse_args()

    email_target = args.email.strip().lower()

    with get_db_cursor(commit=True) as cur:
        # Kiểm tra xem user đã từng đăng nhập qua Firebase chưa
        cur.execute("SELECT id, firebase_uid, email, display_name, role FROM users WHERE LOWER(email) = %s;", (email_target,))
        user = cur.fetchone()

        if not user:
            print(f"\n❌ [LỖI]: Không tìm thấy user có email '{email_target}' trong PostgreSQL!")
            print("👉 HƯỚNG DẪN: Tài khoản này phải đăng nhập vào hệ thống Web ít nhất 1 lần để Firebase Auth đồng bộ thông tin sang database, sau đó mới có thể cấp quyền Admin.\n")
            sys.exit(1)

        if user["role"] == "admin":
            print(f"\nℹ️  [THÔNG BÁO]: Tài khoản '{email_target}' (ID: {user['id']}) hiện đã là Admin rồi.\n")
            sys.exit(0)

        # Cập nhật quyền Admin
        cur.execute("UPDATE users SET role = 'admin' WHERE id = %s RETURNING id, email, role;", (user["id"],))
        updated = cur.fetchone()
        print(f"\n🎉 [THÀNH CÔNG]: Đã nâng cấp tài khoản '{updated['email']}' lên quyền 'admin'!")
        print(f"👉 Bây giờ tài khoản này đã có quyền duyệt và chỉnh sửa ngân hàng câu hỏi.\n")

if __name__ == "__main__":
    main()
