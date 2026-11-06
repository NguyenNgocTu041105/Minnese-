-- ============================================================================
-- FORMAL MIGRATION PROPOSAL: QUESTION KNOWLEDGE LINKS TABLE
-- Migration ID: 20261025_001_create_question_knowledge_links
-- Target Database: data/qbank/qbank.db (questions relation)
-- Status: PROPOSAL ONLY — AWAITING EXPLICIT USER APPROVAL (DO NOT RUN AUTOMATICALLY)
-- Author: M2 Worker 1 (m2_worker_1) based on M2 Explorer 3 specification
-- Date: 2026-10-25T07:45:00Z
-- ============================================================================

-- 1. LÝ DO ĐỀ XUẤT (RATIONALE):
-- Hiện tại hệ thống liên kết tri thức (Knowledge Linking) chạy an toàn in-memory (RAM)
-- bằng cách phân tích và quét văn bản câu hỏi kết hợp bộ từ điển đề cương khi máy chủ khởi động.
-- Khi ngân hàng câu hỏi mở rộng lên hàng nghìn câu, việc tính toán in-memory mỗi lần
-- có thể tiêu tốn chu kỳ CPU. Bảng quan hệ trung gian `question_knowledge_links` trong SQLite sẽ cho phép:
--   a) Tra cứu liên kết tri thức hai chiều với chi phí O(1) qua các chỉ mục chuyên dụng.
--   b) Lưu vết bằng chứng liên kết (evidence) từ phương án đúng, stem hay câu dẫn.
--   c) Hỗ trợ tính toán độ bao phủ đa chiều (Level, Skill, Part Type, Tier) trực tiếp bằng SQL Aggregates.
--   d) Hỗ trợ kiểm thử và báo cáo độc lập mà không cần quét toàn bộ văn bản.

-- 2. ĐỊNH NGHĨA SCHEMA CỘNG DỒN AN TOÀN (SAFE ADDITIVE DDL):
-- Lưu ý: DDL này chỉ bổ sung bảng mới, hoàn toàn không sửa đổi hoặc xóa bất kỳ bảng hiện hữu nào.
CREATE TABLE IF NOT EXISTS question_knowledge_links (
  question_id TEXT NOT NULL,
  knowledge_type TEXT NOT NULL, -- 'vocab' | 'grammar' | 'hanzi_recognition' | 'hanzi_writing' | 'topic'
  knowledge_id TEXT NOT NULL,   -- Stable Key (ví dụ: 'vocab:1:电影', 'char_rec_1_妈', 'char_wri_1_爱', 'grammar:1:把字句')
  knowledge_key TEXT NOT NULL,  -- Chuỗi ký tự hiển thị (ví dụ: '电影', '把字句', '妈', '爱')
  level INTEGER NOT NULL,       -- HSK Level 1..6
  role TEXT NOT NULL,           -- 'context' | 'directly_tested' | 'reinforced' | 'applied' | 'recognized' | 'written'
  evidence TEXT,                -- 'explicit_tested_vocab_column' | 'cloze_exact_option_match' | 'picture_match_single_word_target' | 'reading_comprehension_filtered_content_word' | 'context_in_question_text'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (question_id, knowledge_type, knowledge_id),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 3. CÁC CHỈ MỤC TỐC ĐỘ CAO (HIGH-PERFORMANCE INDEXES):
CREATE INDEX IF NOT EXISTS idx_qkl_type_key ON question_knowledge_links(knowledge_type, knowledge_key);
CREATE INDEX IF NOT EXISTS idx_qkl_level_role ON question_knowledge_links(level, role);
CREATE INDEX IF NOT EXISTS idx_qkl_question ON question_knowledge_links(question_id);
CREATE INDEX IF NOT EXISTS idx_qkl_type_level ON question_knowledge_links(knowledge_type, level);

-- 4. KẾ HOẠCH BẢO TOÀN DỮ LIỆU (DATA PRESERVATION PLAN):
-- - Thao tác hoàn toàn là cộng dồn (strictly additive: CREATE TABLE IF NOT EXISTS).
-- - Tuyệt đối không can thiệp, không sửa đổi dữ liệu các bảng hiện hành:
--   * `questions` (89 dòng đã duyệt)
--   * `pending_questions` (111 dòng lịch sử và hàng đợi)
--   * `exam_sessions` (246 dòng lịch sử thi)
-- - Tệp `data/hsk_exam.db` được bảo toàn nguyên vẹn mã băm SHA-256 (DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1).

-- 5. KẾ HOẠCH HOÀN TÁC (ROLLBACK SCRIPT):
-- Nếu cần hủy bỏ migration hoặc khôi phục trạng thái ban đầu, chỉ cần thực thi lệnh sau:
-- DROP TABLE IF EXISTS question_knowledge_links;

-- 6. KIỂM TRA TƯƠNG THÍCH (COMPATIBILITY CHECK):
-- Toàn bộ mã nguồn backend và các bài test tiếp tục hoạt động 100% bình thường vì bảng mới
-- hoạt động độc lập và không xâm lấn bất kỳ cột nào của các bảng cũ.
