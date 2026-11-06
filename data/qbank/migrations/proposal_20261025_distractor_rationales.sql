-- ============================================================================
-- FORMAL MIGRATION PROPOSAL: QUESTION DISTRACTOR RATIONALES SCHEMA
-- Migration ID: 20261025_002_create_question_distractor_rationales
-- Target Database: data/qbank/qbank.db (questions and pending_questions relations)
-- Status: PROPOSAL ONLY — AWAITING EXPLICIT USER APPROVAL (DO NOT RUN AUTOMATICALLY)
-- Author: Worker Milestone 2 (Phase 4 M2)
-- Date: 2026-10-25T14:10:00Z
-- ============================================================================

-- 1. LÝ DO ĐỀ XUẤT (RATIONALE):
-- Hiện tại hệ thống lưu trữ phân tích phương án nhiễu (distractor rationales) an toàn
-- dưới dạng văn bản có cấu trúc bên trong cột `explanation_vi` (ví dụ: các đoạn
-- '[Phân tích phương án nhiễu]', '+ Phương án B (...): ...').
-- Giải pháp nhúng trong `explanation_vi` bảo toàn tính bất biến của schema SQLite hiện tại,
-- đáp ứng 100% yêu cầu R5 trong giai đoạn Phase 4.
-- Khi nâng cấp hệ thống kiểm tra chất lượng câu hỏi nâng cao (Challenger QA / Analytics),
-- việc chuẩn hóa distractor rationales thành quan hệ dữ liệu chuyên dụng sẽ mang lại các lợi ích:
--   a) Tách bạch giao diện: Frontend Admin và Học viên có thể hiển thị thẻ phân tích
--      riêng cho từng phương án sai (A/B/C/D) ngay khi học viên chọn nhầm.
--   b) Phân loại loại lỗi (error_type): Phân định rõ bẫy từ vựng đồng nghĩa, sai ngữ pháp,
--      lỗi ngữ cảnh hay từ vượt cấp để cung cấp gợi ý học tập chuẩn xác.
--   c) Kiểm tra tính đơn đáp án (single-correct-answer verification): Xác thực tự động
--      rằng 100% các phương án nhiễu đều có lý do bác bỏ rõ ràng, tránh câu hỏi mơ hồ.
--   d) Truy vấn thống kê chất lượng đề: Đo lường phân phối lỗi của các phương án nhiễu.

-- 2. ĐỊNH NGHĨA SCHEMA CỘNG DỒN AN TOÀN (SAFE ADDITIVE DDL):
-- Lưu ý: DDL này chỉ bổ sung bảng mới hoặc view mới, hoàn toàn KHÔNG sửa đổi hoặc xóa bất kỳ bảng hiện hữu nào.
CREATE TABLE IF NOT EXISTS question_distractor_rationales (
  question_id TEXT NOT NULL,
  option_idx INTEGER NOT NULL,      -- Chỉ số phương án (0, 1, 2, 3 tương ứng A, B, C, D)
  option_text TEXT NOT NULL,        -- Nội dung chữ Hán / Pinyin của phương án
  rationale_vi TEXT NOT NULL,       -- Lời giải thích tiếng Việt vì sao phương án này sai / không phù hợp
  error_type TEXT DEFAULT 'semantic_inconsistency', -- 'lexical_confusion' | 'collocation_error' | 'over_level' | 'grammatical_misalignment' | 'semantic_inconsistency'
  is_correct BOOLEAN DEFAULT 0,     -- 0: Phương án nhiễu (sai), 1: Phương án đúng
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (question_id, option_idx),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 3. CÁC CHỈ MỤC TỐC ĐỘ CAO (HIGH-PERFORMANCE INDEXES):
CREATE INDEX IF NOT EXISTS idx_qdr_question_id ON question_distractor_rationales(question_id);
CREATE INDEX IF NOT EXISTS idx_qdr_error_type ON question_distractor_rationales(error_type);
CREATE INDEX IF NOT EXISTS idx_qdr_option_idx ON question_distractor_rationales(option_idx);

-- 4. KẾ HOẠCH BẢO TOÀN DỮ LIỆU (DATA PRESERVATION PLAN):
-- - Thao tác hoàn toàn là cộng dồn (strictly additive: CREATE TABLE IF NOT EXISTS).
-- - Tuyệt đối không can thiệp, không sửa đổi dữ liệu các bảng hiện hành:
--   * `questions` (89 dòng đã duyệt)
--   * `pending_questions` (111 dòng lịch sử và hàng đợi)
--   * `exam_sessions` (246 dòng lịch sử thi)
-- - Cột `explanation_vi` trong `questions` và `pending_questions` tiếp tục giữ nguyên
--   toàn bộ nội dung văn bản giải thích và phân tích phương án nhiễu để đảm bảo khả năng
--   tương thích ngược 100%.
-- - Tệp `data/hsk_exam.db` được bảo toàn nguyên vẹn mã băm SHA-256 (DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1).

-- 5. KẾ HOẠCH HOÀN TÁC (ROLLBACK SCRIPT):
-- Nếu người dùng không phê duyệt hoặc cần hủy bỏ migration để khôi phục trạng thái ban đầu:
-- DROP TABLE IF EXISTS question_distractor_rationales;

-- 6. KIỂM TRA TƯƠNG THÍCH (COMPATIBILITY CHECK):
-- Toàn bộ mã nguồn backend (`qbankCoverageEngine.ts`, `questionValidator.ts`, `qbankRoutes.ts`)
-- và frontend (`QBankAdmin.tsx`) tiếp tục vận hành 100% dựa trên trường `explanation_vi`.
-- Bảng này chỉ được kích hoạt đồng bộ khi có sự phê duyệt chính thức từ người dùng.
