# 🇨🇳 Minnese - Nền tảng Học tiếng Trung & Luyện thi HSK Thông minh

<div align="center">

![Minnese Logo](public/minnie-mascot.png)

**Nền tảng e-Learning tiếng Trung toàn diện thế hệ mới từ HSK 1 đến HSK 6.**  
Tích hợp giáo trình chuẩn BLCUP, ngân hàng đề thi chuẩn hóa (QBank), gia sư AI đồng hành luyện khẩu ngữ thời gian thực, phòng luyện chữ Hán tương tác và hệ thống âm thanh phân vai độc lập 100%.

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Mục lục

- [🌟 Giới thiệu Tổng quan](#-giới-thiệu-tổng-quan)
- [✨ Tính năng Nổi bật](#-tính-năng-nổi-bật)
  - [1. Giáo trình Chuẩn Hóa BLCUP & Tranh Minh Họa Màu Nước](#1-giáo-trình-chuẩn-hóa-blcup--tranh-minh-họa-màu-nước)
  - [2. Hệ thống Âm thanh Phân vai Độc lập (100% Studio Neural Voices)](#2-hệ-thống-âm-thanh-phân-vai-độc-lập-100-studio-neural-voices)
  - [3. Ngân hàng Đề thi HSK CBT (QBank & Mock Exam Runner)](#3-ngân-hàng-đề-thi-hsk-cbt-qbank--mock-exam-runner)
  - [4. Phòng Luyện Viết Chữ Hán (Hanzi Stroke Studio)](#4-phòng-luyện-viết-chữ-hán-hanzi-stroke-studio)
  - [5. Thẻ Ghi Nhớ Lặp Lại Ngắt Quãng (SRS Flashcards)](#5-thẻ-ghi-nhớ-lặp-lại-ngắt-quãng-srs-flashcards)
  - [6. Gia sư AI Luyện Khẩu Ngữ (Live Voice Call & AI Tutor)](#6-gia-sư-ai-luyện-khẩu-ngữ-live-voice-call--ai-tutor)
  - [7. Trung tâm Quản trị Lớp học (Teacher & Admin Studio)](#7-trung-tâm-quản-trị-lớp-học-teacher--admin-studio)
- [👥 Master Character Bible (Hệ thống Nhân vật Xuyên suốt)](#-master-character-bible-hệ-thống-nhân-vật-xuyên-suốt)
- [🛠 Kiến trúc Công nghệ (Tech Stack)](#-kiến-trúc-công-nghệ-tech-stack)
- [📂 Cấu trúc Dự án (Project Structure)](#-cấu-trúc-dự-án-project-structure)
- [🚀 Hướng dẫn Cài đặt & Chạy Thực tế](#-hướng-dẫn-cài-đặt--chạy-thực-tế)
- [📄 Giấy phép (License)](#-giấy-phép-license)

---

## 🌟 Giới thiệu Tổng quan

**Minnese** là giải pháp phần mềm giáo dục toàn diện dành cho người học tiếng Trung Quốc ở mọi trình độ (HSK 1 đến HSK 6). Dự án kết hợp tinh hoa sư phạm của bộ giáo trình chuẩn **Đại học Ngôn ngữ và Văn hóa Bắc Kinh (BLCUP)** cùng sức mạnh của công nghệ AI hiện đại nhằm mang lại trải nghiệm học tập nhập vai, chuẩn xác và trực quan nhất.

Mỗi bài học trong Minnese không chỉ là những dòng chữ khô khan, mà là một **câu chuyện tiếp diễn sống động** về cuộc sống du học, giao lưu văn hóa và sinh hoạt thường nhật tại Bắc Kinh thông qua dàn nhân vật được thiết kế xuyên suốt và đồng nhất.

---

## ✨ Tính năng Nổi bật

### 1. Giáo trình Chuẩn Hóa BLCUP & Tranh Minh Họa Màu Nước
* **105 bài khóa hoàn chỉnh** (HSK 1: 45 bài khóa / 15 bài học; HSK 2: 60 bài khóa / 15 bài học).
* **Mỹ thuật Thủy mặc & Màu nước truyền thống:** Toàn bộ tranh minh họa được xây dựng theo phong cách giáo trình BLCUP chính thống (16:9 widescreen, màu pastel ấm dịu, tuyệt đối không có rác chữ hay bóng thoại).
* **Đồng bộ ngữ cảnh tuyệt đối:** Từng khung cảnh (trời mưa rơi trên cửa kính, cảnh ga tàu điện, cảnh tiệm sủi cảo nóng hổi, cảnh đón bạn ở sân bay Đại Hưng...) đều bám sát 100% nội dung hội thoại.

### 2. Hệ thống Âm thanh Phân vai Độc lập (100% Studio Neural Voices)
* **Khắc phục triệt để hiện tượng trùng giọng:** Mỗi nhân vật trong hội thoại đều được chỉ định một Neural Voice Model độc lập từ Microsoft Edge-TTS:
  * 👩‍🏫 **Cô giáo Vương Nhất Phi (30t):** `zh-CN-XiaoxiaoNeural` (giọng chuẩn phát thanh Bắc Kinh, mực thước sư phạm).
  * 👱‍♀️ **Bạch Gia Nguyệt (20t, du học sinh):** `zh-CN-shaanxi-XiaoniNeural` (chất giọng trong trẻo, dịu dàng, ngọt ngào).
  * 👩‍🦰 **Annie (20t, sinh viên phương Tây):** `zh-CN-XiaoyiNeural` (hoạt bát, phóng khoáng, biểu cảm tươi vui).
  * 👩 **Vương Nhất Tuyết (35t, chị gái cô Vương):** `zh-CN-liaoning-XiaobeiNeural` (giọng người phụ nữ gia đình đằm thắm, chín chắn).
  * 👨‍🎓 **Lý Văn (20t, nam sinh viên y khoa):** `zh-CN-YunxiNeural` (giọng nam thanh niên trong sáng, trí thức).
  * 🧑‍🎓 **Trần Thiên Trung (20t, nam du học sinh Thái):** `zh-CN-YunyangNeural` (âm vực trầm ấm, nam tính, tương phản rõ rệt với Lý Văn).
  * 👨‍⚕️ **Bác sĩ Lưu Minh (40t):** `zh-CN-YunjianNeural` (giọng người cha/bác sĩ trung niên điềm đạm, ấm áp).
  * 👦 **Bé Lưu Tiểu Minh (8t):** `zh-CN-YunxiaNeural` (giọng bé trai ngộ nghĩnh).
* **Karaoke từng câu:** Hiển thị thời gian đồng bộ chính xác tới từng mili-giây, hỗ trợ bấm nghe từng câu riêng biệt hoặc nghe trọn bài khóa với khoảng lặng thở tự nhiên 0.4s giữa các lượt thoại.

### 3. Ngân hàng Đề thi HSK CBT (QBank & Mock Exam Runner)
* Mô phỏng chuẩn 100% giao diện thi trên máy tính (**Computer-Based Test - CBT**) của kỳ thi HSK chính thức từ HSK 1 đến HSK 6.
* Phân chia đầy đủ các phần thi: **Nghe hiểu (Listening)**, **Đọc hiểu (Reading)** và **Viết (Writing)**.
* Chấm điểm tức thì, thống kê ma trận năng lực, phân tích điểm mạnh - điểm yếu và lưu vết câu làm sai vào **Sổ tay Câu hỏi Sai (Wrong Answer Notebook)** để ôn luyện lại.

### 4. Phòng Luyện Viết Chữ Hán (Hanzi Stroke Studio)
* Mô phỏng động quy tắc bút thuận từng nét chữ Hán với công nghệ vector mượt mà.
* Hướng dẫn giải nghĩa bộ thủ, âm Hán Việt, cấu trúc chữ (trên-dưới, trái-phải, bao quanh) và bảng luyện viết tay tương tác trực tiếp trên màn hình cảm ứng hoặc chuột.

### 5. Thẻ Ghi Nhớ Lặp Lại Ngắt Quãng (SRS Flashcards)
* Ứng dụng thuật toán **Spaced Repetition System (SRS)** giúp chuyển kiến thức từ trí nhớ ngắn hạn sang dài hạn.
* Hỗ trợ phát âm chuẩn bản xứ, phân loại cấp độ nhớ (Again, Hard, Good, Easy) và theo dõi lộ trình ghi nhớ từ vựng mỗi ngày.

### 6. Gia sư AI Luyện Khẩu Ngữ (Live Voice Call & AI Tutor)
* Tích hợp công nghệ nhận dạng giọng nói và phản hồi thời gian thực với trợ lý ảo **Minnie AI**.
* Hỗ trợ gọi thoại trực tiếp để luyện phản xạ giao tiếp tiếng Trung theo từng chủ đề bài học, tự động phát hiện và sửa lỗi ngữ pháp một cách khéo léo.

### 7. Trung tâm Quản trị Lớp học (Teacher & Admin Studio)
* Quản lý phân quyền học viên, cấp mã lớp (Class Code), kích hoạt quyền truy cập giáo trình.
* Kiểm duyệt câu hỏi đề thi tự động, điều chỉnh ngân hàng đề và quản trị nội dung bài tập bổ trợ.

---

## 👥 Master Character Bible (Hệ thống Nhân vật Xuyên suốt)

Để đảm bảo tính nhất quán từ HSK 1 đến HSK 6, hệ thống xây dựng bộ quy chuẩn hình tượng nhân vật bất biến:

| Nhân vật | Tuổi / Nghề nghiệp | Ngoại hình & Trang phục đặc trưng | Giọng đọc (Neural Voice) |
| :--- | :--- | :--- | :--- |
| **Vương Nhất Phi (王一飞)** | 30t, Nữ giáo viên đại học | Tóc bob ngắn đen cá tính, kính mắt gọng kim loại chữ nhật, áo vest xanh navy hoặc áo khoác dạ camel mùa đông | `zh-CN-XiaoxiaoNeural` |
| **Bạch Gia Nguyệt (白家月)** | 20t, Nữ du học sinh | Tóc đen buộc đuôi ngựa gọn gàng, áo sơ mi xanh pastel hoặc áo len kem nhẹ nhàng, nụ cười dịu dàng | `zh-CN-shaanxi-XiaoniNeural` |
| **Annie (安妮)** | 20t, Nữ sinh phương Tây | Tóc vàng nâu gợn sóng buông xõa, áo len/cardigan hồng pastel hoặc váy dạo phố trẻ trung, năng động | `zh-CN-XiaoyiNeural` |
| **Vương Nhất Tuyết (王一雪)** | 35t, Chị gái cô Vương | Tóc dài đen uốn nhẹ ngang lưng, áo len dệt màu kem hoặc đầm gia đình trang nhã, nét đẹp đằm thắm | `zh-CN-liaoning-XiaobeiNeural` |
| **Lý Văn (李文)** | 20t, Nam sinh viên Y khoa | Tóc đen cắt ngắn thư sinh, áo khoác gió thể thao màu xanh dương hoặc áo hoodie trẻ trung, mang ba lô | `zh-CN-YunxiNeural` |
| **Trần Thiên Trung (陈天中)** | 20t, Nam du học sinh Thái | Dáng người khỏe khoắn, áo khoác màu cam hoặc xám phối đen năng động, phong thái điềm tĩnh | `zh-CN-YunyangNeural` |
| **Dương Đồng Nhạc (杨同乐)** | 28t, Bạn trai cô Vương | Dáng người cao ráo, mắt to sáng, áo khoác len/dạ ấm cúng phong cách thanh lịch công sở | `zh-CN-YunyangNeural` (+6Hz) |
| **Bác sĩ Lưu Minh (刘明)** | 40t, Bác sĩ ngoại khoa | Tóc rẽ ngôi gọn gàng, đeo kính cận, áo sơ mi polo hoặc áo blouse trắng, đeo đồng hồ da | `zh-CN-YunjianNeural` |
| **Lưu Tiểu Tuyết (刘小雪)** | 14t, Con gái bác sĩ Lưu | Tóc búi củ tỏi hoặc tết bím đôi, áo nỉ hoodie học sinh cấp 2 năng động | `zh-CN-XiaoyiNeural` (+25Hz) |
| **Lưu Tiểu Minh (刘小明)** | 8t, Con trai bác sĩ Lưu | Tóc đầu đinh ngộ nghĩnh, áo phông in hình khủng long/hoạt hình màu vàng hoặc xanh lá | `zh-CN-YunxiaNeural` |

---

## 🛠 Kiến trúc Công nghệ (Tech Stack)

### Frontend
* **Core:** React 19, TypeScript, Vite
* **Styling & UI:** Tailwind CSS v4, Lucide Icons
* **Biểu đồ & Báo cáo:** Recharts
* **Xử lý tài liệu:** PDF.js, SheetJS (XLSX)

### Backend & AI Pipeline
* **Server Runtime:** Node.js, Express, ESBuild (`dist/server.cjs`)
* **Hạ tầng Dữ liệu:** PostgreSQL, SQLite, Firebase Authentication & Firestore
* **Tổng hợp Âm thanh (TTS):** Edge-TTS Python Engine, Mutagen MP3 metadata processor
* **Mô hình Trí tuệ Nhân tạo:**
  * **LLM:** Google Gemini 3.5 / 2.5, DeepSeek V3, Groq Llama, Ollama (Local LLM)
  * **Image Generation:** Gemini Image Models theo quy chuẩn BLCUP Art Engine

---

## 📂 Cấu trúc Dự án (Project Structure)

```
minnese/
├── public/
│   ├── audio/coursebook/       # 105 file audio full & hàng trăm audio dòng thoại
│   ├── textbook_art/           # Toàn bộ tranh minh họa màu nước HSK 1 & HSK 2
│   ├── favicon.svg             # Logo biểu tượng Minnese
│   └── minnie-mascot.png       # Linh vật trợ lý Minnie
├── src/
│   ├── components/
│   │   ├── Admin/              # AI Exam Studio, Workbook Studio, Dashboard
│   │   ├── Coursebook/         # Giao diện Giáo trình, Karaoke Audio, Bài tập
│   │   ├── Dictionary/         # Tra cứu từ điển HSK, bộ thủ, chiết tự
│   │   ├── Flashcards/         # Luyện nhớ từ vựng SRS
│   │   ├── LiveVoiceCall/      # Gọi thoại AI luyện khẩu ngữ thời gian thực
│   │   ├── Quizzes/            # Thi thử HSK CBT, bộ đề ngẫu nhiên
│   │   └── Writing/            # Xưởng luyện viết chữ Hán và chấm bài luận
│   ├── data/
│   │   ├── newHsk1BookData.ts  # Giáo trình HSK 1 đầy đủ 15 bài học
│   │   ├── newHsk2BookData.ts  # Giáo trình HSK 2 đầy đủ 15 bài học
│   │   ├── coursebookAudioManifest.ts # Manifest ánh xạ âm thanh & karaoke
│   │   └── ragKnowledgeBase.ts # Cơ sở tri thức ngữ pháp & từ đồng nghĩa
│   ├── server/                 # API server, waterfall generator, cron job
│   └── utils/                  # Xử lý pinyin, lưu trữ từ vựng, TTS
├── scripts/                    # Scripts sinh audio, tạo tranh, kiểm tra dữ liệu
├── data/qbank/                 # Blueprint và ngân hàng câu hỏi đề thi
├── tests/                      # Bộ kiểm thử đơn vị, kiểm thử E2E và chịu tải
└── package.json
```

---

## 🚀 Hướng dẫn Cài đặt & Chạy Thực tế

### 1. Yêu cầu hệ thống
* **Node.js:** phiên bản `18.x` trở lên (khuyến nghị `20.x`).
* **Python:** phiên bản `3.10` trở lên (dùng cho các tác vụ Edge-TTS).

### 2. Cài đặt các gói phụ thuộc
```bash
# Cài đặt thư viện Node.js
npm install

# Cài đặt các thư viện Python cần thiết cho bộ xử lý âm thanh
pip install edge-tts mutagen
```

### 3. Cấu hình Biến Môi trường (.env)
Tạo file `.env` tại thư mục gốc dự án (tham khảo mẫu `.env.example`):
```env
PORT=8000
DATABASE_URL=postgresql://postgres:password@localhost:5432/hsk_exam_db
GEMINI_API_KEY=your_gemini_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

### 4. Khởi chạy Ứng dụng
```bash
# Chạy môi trường phát triển (Hot reload)
npm run dev

# Hoặc đóng gói và chạy bản Production tối ưu
npm run build
node dist/server.cjs
```
Truy cập trình duyệt tại địa chỉ: `http://localhost:5173` (hoặc cổng cấu hình trong terminal).

---

## 📄 Giấy phép (License)

Dự án được phân phối dưới giấy phép **MIT License**. Mọi đóng góp phát triển vì cộng đồng học tiếng Trung đều được hoan nghênh nồng nhiệt!

---

<div align="center">
<strong>Minnese - Cùng bạn chinh phục tiếng Trung từ vạch xuất phát đến HSK 6 đỉnh cao! 🚀</strong>
</div>
