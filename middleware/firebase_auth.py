import os
import json
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config.settings import settings
from db.connection import get_db_cursor

# Khởi tạo Firebase Admin SDK (Ưu tiên nạp từ chuỗi JSON trên PaaS trước)
if not firebase_admin._apps:
    cred = None
    if settings.FIREBASE_CREDENTIALS_JSON:
        try:
            cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
            cred = credentials.Certificate(cred_dict)
        except json.JSONDecodeError as json_err:
            raise RuntimeError(
                f"[Firebase Init Error] Biến FIREBASE_CREDENTIALS_JSON không phải là JSON hợp lệ: {json_err}. "
                "Hãy kiểm tra lại việc copy-paste chuỗi JSON trên Dashboard PaaS."
            )
    elif os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
    else:
        # Fallback cảnh báo khi chưa mount credentials
        print("[Firebase Warning] Chưa cấu hình FIREBASE_CREDENTIALS_JSON hoặc file credentials không tồn tại.")

    if cred:
        firebase_admin.initialize_app(cred)

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        # 1. Xác thực ID Token với Firebase Admin
        decoded_token = firebase_auth.verify_id_token(token)
        firebase_uid = decoded_token.get("uid")
        email = decoded_token.get("email", "")
        display_name = decoded_token.get("name", "")

        if not firebase_uid:
            raise HTTPException(status_code=401, detail="Invalid token: missing UID")

        # 2. Upsert thông tin user vào PostgreSQL (chỉ tốn query local)
        with get_db_cursor(commit=True) as cur:
            cur.execute("""
                INSERT INTO users (firebase_uid, email, display_name, role)
                VALUES (%s, %s, %s, 'student')
                ON CONFLICT (firebase_uid) 
                DO UPDATE SET email = EXCLUDED.email, display_name = EXCLUDED.display_name
                RETURNING id, firebase_uid, email, display_name, role;
            """, (firebase_uid, email, display_name))
            user = cur.fetchone()
            return dict(user)

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required.")
    return current_user
