# 📋 DEPLOYMENT CHECKLIST & SMOKE TEST

Tài liệu kiểm thử nghiệm thu hệ thống sau khi deploy lên Production (Railway / Render / Vercel).

---

### 1. Health-Check Endpoint
Kiểm tra xem Backend API đã online và kết nối thành công tới Database & Redis chưa:
```bash
curl -i https://<YOUR-API-DOMAIN>.up.railway.app/health
```
**Kết quả mong đợi:**
`HTTP/1.1 200 OK`
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2026-09-13T19:00:00Z"
}
```

---

### 2. Kiểm thử API Sinh đề thi thực tế
Lấy `idToken` từ Firebase Client (trên trang Web) và gọi thử API:
```bash
curl -X POST https://<YOUR-API-DOMAIN>.up.railway.app/api/generate-exam \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"level": "HSK3", "limit": 20}'
```
**Kết quả mong đợi:** Trả về bộ 20 câu hỏi HSK 3 với đầy đủ Hán tự, Pinyin và các lựa chọn đã được đảo ngẫu nhiên.

---

### 3. Kiểm thử CLI Scripts chạy thủ công (Smoke Test)
Chạy thử các cron job trực tiếp từ Terminal trên container:

1. **Test Crawler:**
   ```bash
   python workers/run_crawler_once.py --source "TestRun" --url "https://example.com/mock-hsk" --hsk-level "HSK3"
   ```
2. **Test AI Batch Explainer:**
   ```bash
   python workers/run_ai_batch_once.py
   ```
3. **Test Cấp quyền Admin:**
   ```bash
   python scripts/promote_admin.py --email "your-email@center.edu.vn"
   ```

---

### 4. Kiểm tra Database Log sau khi chạy Job
Kết nối vào PostgreSQL (Supabase / Neon) và truy vấn:
```sql
-- Kiểm tra lịch sử crawl
SELECT id, source, total_crawled, total_new, total_duplicate, status, started_at, finished_at 
FROM crawl_jobs 
ORDER BY started_at DESC LIMIT 5;

-- Kiểm tra số câu hỏi đã được AI sinh lời giải thích
SELECT count(*) AS total_approved, 
       count(ai_explanation) AS total_explained 
FROM questions 
WHERE status = 'approved';
```
