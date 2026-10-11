-- Kích hoạt extension pgcrypto để sinh UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BẢNG USERS (Đồng bộ từ Firebase Authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- 2. BẢNG BÀI ĐỌC HIỂU DÙNG CHUNG (READING PASSAGES)
CREATE TABLE IF NOT EXISTS reading_passages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passage_text TEXT NOT NULL,
    passage_pinyin TEXT,
    hsk_level VARCHAR(10) NOT NULL CHECK (hsk_level IN ('HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6')),
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reading_passages_level ON reading_passages(hsk_level);

-- 3. BẢNG NGÂN HÀNG CÂU HỎI (QUESTIONS)
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hanzi_content TEXT NOT NULL,
    pinyin_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Format: [{"key": "A", "text": "..."}, {"key": "B", "text": "..."}]
    correct_answer VARCHAR(10) NOT NULL,
    explanation TEXT,
    ai_explanation TEXT,
    hsk_level VARCHAR(10) NOT NULL CHECK (hsk_level IN ('HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6')),
    topic VARCHAR(50) NOT NULL CHECK (topic IN ('vocab', 'grammar', 'reading', 'listening')),
    question_type VARCHAR(50) NOT NULL, -- e.g. 'multiple_choice', 'fill_in_blank', 'sentence_order'
    media_url TEXT, -- Cloudinary / S3 CDN URL
    passage_id UUID REFERENCES reading_passages(id) ON DELETE SET NULL,
    source_url TEXT,
    content_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256(normalized hanzi_content + options + correct_answer)
    status VARCHAR(20) NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
    crawled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Composite Index cho việc lấy mẫu đề ngẫu nhiên siêu tốc
CREATE INDEX IF NOT EXISTS idx_questions_sampling 
ON questions (hsk_level, topic, question_type, status) 
WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_questions_pending_ai 
ON questions (status, ai_explanation) 
WHERE status = 'approved' AND ai_explanation IS NULL;

-- 4. BẢNG CÂU HỎI HỌC VIÊN ĐÃ GẶP (USER SEEN QUESTIONS)
CREATE TABLE IF NOT EXISTS user_seen_questions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_user_seen_lookup ON user_seen_questions(user_id, seen_at);

-- 5. BẢNG KẾT QUẢ THI (EXAM RESULTS)
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hsk_level VARCHAR(10) NOT NULL,
    question_ids JSONB NOT NULL,
    user_answers JSONB NOT NULL,
    score NUMERIC(5, 2) NOT NULL,
    total_questions INT NOT NULL,
    time_spent_seconds INT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_exam_results_user ON exam_results(user_id, submitted_at DESC);

-- 6. BẢNG THẺ GHI NHỚ TỪ VỰNG (FLASHCARDS - SM2)
CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word VARCHAR(100) NOT NULL,
    pinyin VARCHAR(150) NOT NULL,
    meaning TEXT NOT NULL,
    source_question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    review_stage INT NOT NULL DEFAULT 0,
    ease_factor NUMERIC(4, 2) NOT NULL DEFAULT 2.50,
    interval_days INT NOT NULL DEFAULT 1,
    next_review_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_review ON flashcards(user_id, next_review_at);

-- 7. BẢNG GIÁM SÁT TIẾN TRÌNH CRAWL (CRAWL JOBS)
CREATE TABLE IF NOT EXISTS crawl_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE,
    source VARCHAR(255) NOT NULL,
    total_crawled INT DEFAULT 0,
    total_new INT DEFAULT 0,
    total_duplicate INT DEFAULT 0,
    total_errors INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'partial')),
    error_log TEXT
);
