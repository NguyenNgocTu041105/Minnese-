# Báo Cáo Kiểm Thử Toàn Diện Tính Năng "Nhập Đề Đa Nguồn" (Milestone M1)

**Thời gian kiểm thử:** 2026-11-02T21:10:00Z  
**Môi trường:** Node.js v22.14.0, SQLite (node:sqlite DatabaseSync), Express 4.x, Vitest 5.0.5, Python 3.14.7  
**Test Suite tự động:** `tests/test_import_edge_cases.test.ts` (15/15 passed 100%), `tests/adversarial_r3_import_stress.test.ts` (18/18 passed 100%), `tests/file_upload_comprehensive_cases.test.ts` (42/42 passed 100%)  
**File mục tiêu:** `src/server/llm/universalQuestionParser.ts`, `src/server/qbankRoutes.ts`

---

## 1. Tổng Quan Kết Quả

| Danh mục | Số lượng ca kiểm thử | Đạt (Passed) | Thất bại (Failed) | Tỷ lệ thành công |
|---|---|---|---|---|
| **File Upload (`POST /api/qbank/upload-file`)** | 8 | 8 | 0 | 100% |
| **Text Paste (`POST /api/qbank/import`)** | 7 | 7 | 0 | 100% |
| **Tổng cộng** | **15** | **15** | **0** | **100%** |

---

## 2. Chi Tiết Kiểm Thử 8 Ca File Upload (`importMode === 'file'`, Route `POST /api/qbank/upload-file`)

### Case 1: File `.txt` hợp lệ có 5 câu hỏi HSK format
- **Mô tả:** Tải lên file văn bản UTF-8 chứa 5 câu hỏi HSK 1 đọc hiểu chuẩn kèm đầy đủ `A. B. C. D.`, `Đáp án: A`, `Giải thích: ...`.
- **Dữ liệu đầu vào:** File `test_5q.txt` base64 (5 câu hỏi phân định bằng `Câu 1:`, `Câu 2:`, ...).
- **Kết quả thực tế:** HTTP 200 OK. `total_parsed: 5`, `accepted_count: 5`, `rejected_count: 0`. Cả 5 câu hỏi vượt qua 6 Quality Gates và được lưu vào bảng `pending_questions`.
- **Trạng thái:** PASS.

### Case 2: File `.json` hợp lệ (array `CandidateQuestion`)
- **Mô tả:** Tải lên file JSON array chuẩn chứa đối tượng câu hỏi với các trường `stem`, `options`, `answer_idx`, `explanation_vi`, `level`, `skill`, `part_type`.
- **Dữ liệu đầu vào:** File `candidates.json` base64.
- **Kết quả thực tế:** HTTP 200 OK. `total_parsed: 1`, `accepted_count: 1`, `rejected_count: 0`.
- **Bug phát hiện & Khắc phục:**
  - *Bug ban đầu:* Câu hỏi mẫu ban đầu có stem `"今天天气怎么样？____很冷。"` và phương án `0` là `"今天"`. Gate 1 (`gate1_schema`) bắt chính xác lỗi Answer Leakage ("Stem answer leakage detected: correct option '今天' already appears in the stem outside the blank placeholder").
  - *Fixed:* Dữ liệu kiểm thử được chuẩn hóa thành stem không bị lộ đáp án `"外面下雨了，____很冷。"` với phương án `["现在", "医生", "飞机", "汉语"]`. Gate 1 và cả 6 Gates đều thông qua.
- **Trạng thái:** PASS.

### Case 3: File rỗng (0 byte)
- **Mô tả:** Gửi payload với chuỗi `file_base64: ""` hoặc buffer rỗng `Buffer.alloc(0)`.
- **Kết quả mong đợi:** HTTP 400 Bad Request với thông báo lỗi rõ ràng bằng tiếng Việt.
- **Kết quả thực tế:** HTTP 400 Bad Request.
  ```json
  {
    "success": false,
    "error": "Tệp tin rỗng (0 byte)."
  }
  ```
- **Bug phát hiện & Khắc phục:**
  - *Bug ban đầu:* Trước khi sửa, nếu `file_base64` là chuỗi base64 của buffer rỗng (`Buffer.alloc(0)`), server rơi vào parser và trả về HTTP 200 với `total_parsed: 0`.
  - *Fixed: src/server/qbankRoutes.ts line 1595-1605* — Thêm kiểm tra nghiêm ngặt `if (!fileBase64 || buffer.length === 0)` lập tức trả về HTTP 400 `{ success: false, error: 'Tệp tin rỗng (0 byte).' }`.
- **Trạng thái:** PASS.

### Case 4: File không hỗ trợ (`.mp3`, `.png`)
- **Mô tả:** Tải lên các file nhị phân có định dạng không được hỗ trợ như audio `.mp3` hoặc hình ảnh `.png`.
- **Kết quả mong đợi:** HTTP 400 Bad Request với thông báo từ chối định dạng và liệt kê whitelist các đuôi file hỗ trợ (`.xlsx, .xls, .csv, .docx, .pdf, .txt, .json`).
- **Kết quả thực tế:**
  - Với `.mp3`: HTTP 400 `{ success: false, error: "Định dạng tệp tin .mp3 không được hỗ trợ. Chỉ hỗ trợ .xlsx, .xls, .csv, .docx, .pdf, .txt, .json." }`.
  - Với `.png`: HTTP 400 `{ success: false, error: "Định dạng tệp tin .png không được hỗ trợ. Chỉ hỗ trợ .xlsx, .xls, .csv, .docx, .pdf, .txt, .json." }`.
- **Bug phát hiện & Khắc phục:**
  - *Bug ban đầu:* Trước khi sửa, route `upload-file` không có whitelist kiểm tra phần mở rộng file; mọi file không phải `.xlsx/.xls/.csv/.docx/.pdf/.json` đều rơi vào nhánh `else` (mặc định coi là `.txt`), dẫn đến việc cố giải mã nhị phân `.mp3/.png` thành text thô.
  - *Fixed: src/server/qbankRoutes.ts line 1582-1594* — Thêm whitelist `const SUPPORTED_EXTS = ['xlsx', 'xls', 'csv', 'docx', 'pdf', 'txt', 'json'];` kiểm tra cả `fileType` và phần mở rộng trích xuất từ `fileName`. Từ chối ngay lập tức với HTTP 400.
- **Trạng thái:** PASS.

### Case 5: File > 10MB
- **Mô tả:** Tải lên file có kích thước vượt quá giới hạn an toàn 10MB (buffer kích thước 10.5 MB).
- **Kết quả mong đợi:** HTTP 400 Bad Request ngăn chặn DoS và cạn kiệt bộ nhớ.
- **Kết quả thực tế:** HTTP 400 Bad Request.
  ```json
  {
    "success": false,
    "error": "Kích thước tệp tin vượt quá giới hạn cho phép (tối đa 10MB)."
  }
  ```
- **Bug phát hiện & Khắc phục:**
  - *Bug ban đầu:* `server.ts` cấu hình body limit 50MB nhưng `upload-file` không có logic chặn file >10MB, cho phép buffer lớn đi sâu vào parser.
  - *Fixed: src/server/qbankRoutes.ts line 1607-1612* — Thêm kiểm tra `if (buffer.length > 10 * 1024 * 1024)` trả về HTTP 400 với thông điệp tiếng Việt.
- **Trạng thái:** PASS.

### Case 6: File bị corrupt (binary ngẫu nhiên)
- **Mô tả:** Tải lên dữ liệu nhị phân ngẫu nhiên (chuỗi byte rác không tuân theo chuẩn PKZip hay định dạng văn bản hợp lệ) với tên file `corrupt.docx` và `corrupt.txt`.
- **Kết quả mong đợi:** Server bắt lỗi an toàn, không ném ngoại lệ không xử lý (unhandled exception), không crash tiến trình Node.js, luôn trả về JSON response hợp lệ.
- **Kết quả thực tế:**
  - Với `corrupt.docx`: HTTP 400 `{ success: false, error: "Tệp tin bị hỏng hoặc không thể đọc được nội dung: ..." }`.
  - Với `corrupt.txt`: HTTP 200 `{ success: true, total_parsed: 0, message: "Không tìm thấy câu hỏi hợp lệ trong tệp tin đã tải lên." }`.
- **Bug phát hiện & Khắc phục:**
  - *Bug ban đầu:* Gọi `extractUploadedFileDetails` trực tiếp mà không bọc `try/catch` cục bộ, khiến lỗi giải nén ZIP/XML của file hỏng bắn ra ngoài middleware Express (nguy cơ 500 hoặc unhandled promise rejection).
  - *Fixed: src/server/qbankRoutes.ts line 1625-1638* — Bọc `extractUploadedFileDetails` trong khối `try/catch`, bắt sạch mọi lỗi phân tích cú pháp tệp hỏng và trả về HTTP 400 JSON an toàn.
- **Trạng thái:** PASS.

### Case 7: File có câu hỏi trùng lặp (Duplicate Detection)
- **Mô tả:** Tải lên file chứa 2 câu hỏi có nội dung stem và options hoàn toàn trùng lặp.
- **Kết quả mong đợi:** Câu hỏi thứ nhất được chấp nhận; câu hỏi thứ hai bị Gate 5 (`gate5_uniqueness`) và ràng buộc SQLite `ON CONFLICT(content_hash) DO NOTHING` phát hiện, ghi nhận vào `rejected_count`.
- **Kết quả thực tế:** HTTP 200 OK. `total_parsed: 2`, `accepted_count: 1`, `rejected_count: 1`. Kết quả chi tiết câu 2: `passed: false`, `gates.gate5_uniqueness.passed: false`.
- **Trạng thái:** PASS.

### Case 8: File có câu hỏi thiếu field bắt buộc
- **Mô tả:**
  - 8a: Tải lên file JSON câu hỏi thiếu trường bắt buộc `stem: ""`.
  - 8b: Tải lên file text câu hỏi chỉ có 1 phương án duy nhất (`A. 苹果`).
  - 8c: Tải lên câu hỏi điền từ `read_fill_blank_4opt` nhưng chỉ có 2 phương án (thiếu C, D).
- **Kết quả thực tế:**
  - Với 8a: `total_parsed: 0`, `message: "Không tìm thấy câu hỏi hợp lệ..."`.
  - Với 8b: `total_parsed: 0` (parser yêu cầu tối thiểu 2 phương án cho câu trắc nghiệm), `message: "Không tìm thấy câu hỏi hợp lệ..."`.
  - Với 8c: `total_parsed: 1`, `accepted_count: 0`, `rejected_count: 1`. Gate 1 báo lỗi chính xác: `"Options must contain exactly 4 items for task type 'read_fill_blank_4opt' (got 2)"`.
- **Trạng thái:** PASS.

---

## 3. Chi Tiết Kiểm Thử 7 Ca Text Paste (`importMode === 'text'`, Route `POST /api/qbank/import`)

### Case 9: JSON array chuẩn `CandidateQuestion`
- **Mô tả:** Dán chuỗi JSON array chứa các đối tượng câu hỏi hợp lệ vào textarea.
- **Dữ liệu đầu vào:** JSON 1 câu hỏi HSK 2: `stem: "我想去商场____一件衬衫。"`, options: `["买", "写", "听", "画"]`, `answer_idx: 0`.
- **Kết quả thực tế:** HTTP 200 OK. `total_parsed: 1`, `accepted_count: 1`, `rejected_count: 0`.
- **Trạng thái:** PASS.

### Case 10: Output format từ ChatGPT (Numbered List)
- **Mô tả:** Dán văn bản xuất ra từ ChatGPT theo định dạng danh sách đánh số (`1. ... A. B. C. D. Đáp án: A. Giải thích: ...`).
- **Dữ liệu đầu vào:** 2 câu hỏi đánh số thứ tự `1.` và `2.`.
- **Kết quả thực tế:** HTTP 200 OK. `total_parsed: 2`, `accepted_count: 2`, `rejected_count: 0`. Phân tách khối câu hỏi chính xác bằng regex numbered list.
- **Trạng thái:** PASS.

### Case 11: Output format từ Claude (Markdown Format)
- **Mô tả:** Dán văn bản xuất ra từ Claude theo chuẩn Markdown đặc trưng:
  ```markdown
  ### Câu 1:
  **Đề bài:** 他是我的____。
  - **A.** 老师
  - **B.** 苹果
  - **C.** 飞机
  - **D.** 喝水
  **Đáp án:** A
  **Giải thích:** 老师 có nghĩa là thầy giáo.
  ```
- **Kết quả mong đợi:** Phân tách chính xác từng câu hỏi, trích xuất stem không dính tiền tố `**Đề bài:**`, nhận diện các option có gạch đầu dòng và bôi đậm `- **A.**`, nhận diện đáp án `**Đáp án:** A`, trích xuất giải thích sạch ký tự markdown.
- **Kết quả thực tế:** HTTP 200 OK. `total_parsed: 2`, `accepted_count: 2`, `rejected_count: 0`.
  - Câu 1: `stem: "他是我的____。"`, `options[0]: "老师"`, `answer_idx: 0`, `explanation_summary_vi: "老师 có nghĩa là thầy giáo."`.
  - Câu 2: `stem: "我____中国菜。"`, `options[0]: "喜欢"`, `answer_idx: 0`.
- **Bug phát hiện & Khắc phục:**
  - *Bug 1 (Critical):* Trước khi sửa, `universalQuestionParser.ts` trả về `total_parsed: 0` với định dạng Claude Markdown do:
    1. `splitIntoQuestionBlocks` không hỗ trợ tiêu đề `### Câu 1` hoặc `**Câu 1:**`.
    2. `optionLineRegex` không khớp các dòng bắt đầu bằng `- **A.**` hoặc `* **A.**`.
    3. `answerMatch` không khớp `**Đáp án:** A` hoặc `**Đáp án: A**`.
    4. `explIdx` không khớp `**Giải thích:**`.
    5. Vòng lặp stem không nhận diện dòng `- **A.**` là bắt đầu options, dẫn đến nuốt luôn cả options vào stem.
  - *Bug 2 (Regression Edge Case):* Khi nới lỏng `optionLineRegex` bằng `[\)\]）\.\:、\s]*`, từ `"Câu 1"` bị nhận nhầm thành phương án `"C"` vì bắt đầu bằng chữ cái `C` và không có dấu phân cách bắt buộc.
  - *Fixed:*
    1. Cập nhật `splitIntoQuestionBlocks`: `delimiterPattern` bổ sung `(?:###\s*|\*\*)?`.
    2. Cập nhật `optionLineRegex`: `/^(?:[-*•]\s*)?(?:(\[xX✓✔\]|[✓✔]|\*(?!\*))\s*)?(?:\*\*)?[\(\[（]?([A-Fa-f])(?:\*\*|[\)\]）\.\:、\s](?:\*\*)?)\s*(.+)$/` — yêu cầu rõ ràng dấu phân cách `.` / `:` / `)` hoặc thẻ đóng `**` ngay sau chữ cái phương án, loại bỏ hoàn toàn việc nhận nhầm các từ như "Câu", "Chọn".
    3. Cập nhật `answerMatch`: hỗ trợ cả `**Đáp án:**`, `**Correct Answer:**`, `**Đáp án: A**`.
    4. Cập nhật `explIdx` và `firstLine`: làm sạch cả tiền tố `**Giải thích:**` và thẻ bôi đậm sau dấu hai chấm.
    5. Cập nhật bóc tách stem: tự động loại bỏ tiền tố `**Đề bài:**`, `**Câu hỏi:**` và gọt sạch dấu `**` bao quanh.
- **Trạng thái:** PASS.

### Case 12: Text rỗng
- **Mô tả:** Dán chuỗi rỗng `text: ""` hoặc khoảng trắng vào tab Text import.
- **Kết quả mong đợi:** HTTP 200 OK với `total_parsed: 0, accepted_count: 0, rejected_count: 0` và thông báo tiếng Việt `"Không tìm thấy câu hỏi hợp lệ trong nội dung đã nhập."`. Không sinh lỗi.
- **Kết quả thực tế:** HTTP 200 OK. `total_parsed: 0`, `accepted_count: 0`, `results: []`.
- **Trạng thái:** PASS.

### Case 13: Text quá dài (>50,000 ký tự)
- **Mô tả:** Dán văn bản có độ dài > 50,000 ký tự (chuỗi thử nghiệm > 60,000 ký tự lặp lại) nhằm ngăn chặn ReDoS và quá tải server.
- **Kết quả mong đợi:** HTTP 400 Bad Request với thông báo lỗi tiếng Việt rõ ràng.
- **Kết quả thực tế:** HTTP 400 Bad Request.
  ```json
  {
    "success": false,
    "error": "Nội dung văn bản quá dài (vượt quá 50,000 ký tự)."
  }
  ```
- **Bug phát hiện & Khắc phục:**
  - *Bug ban đầu:* Trước khi sửa, route `POST /api/qbank/import` không giới hạn độ dài ký tự của `rawInput`, chấp nhận toàn bộ payload lớn đưa vào biểu thức chính quy phức tạp.
  - *Fixed: src/server/qbankRoutes.ts line 1437-1443* — Thêm kiểm tra `if (typeof rawInput === 'string' && rawInput.length > 50000)` trả về ngay lập tức HTTP 400 với thông báo chuẩn.
- **Trạng thái:** PASS.

### Case 14: JSON không hợp lệ (Malformed JSON)
- **Mô tả:** Dán chuỗi JSON bị lỗi cú pháp: `{"stem": "他是老师", "options": ["A", "B",}`.
- **Kết quả mong đợi:** Server bắt lỗi cú pháp an toàn, tự động chuyển sang parser dạng text khối thay vì crash, trả về HTTP 200 với `total_parsed: 0`.
- **Kết quả thực tế:** HTTP 200 OK. `total_parsed: 0`, server duy trì ổn định 100%.
- **Trạng thái:** PASS.

### Case 15: Câu hỏi chỉ có 2 đáp án (thiếu C, D) cho dạng bài 4 phương án
- **Mô tả:** Dán câu hỏi dạng điền từ `read_fill_blank_4opt` nhưng người dùng chỉ cung cấp 2 phương án A và B:
  ```
  Câu 1: 他是我的____。
  A. 老师
  B. 苹果
  Đáp án: A
  Giải thích: Chỉ có 2 phương án
  ```
- **Kết quả mong đợi:** Parser đọc được 1 câu hỏi, nhưng Gate 1 (`gate1_schema`) bắt lỗi thiếu phương án (yêu cầu 4 phương án cho `read_fill_blank_4opt`), chuyển sang danh sách `rejected` với lý do rõ ràng.
- **Kết quả thực tế:** HTTP 200 OK. `total_parsed: 1`, `accepted_count: 0`, `rejected_count: 1`. `results[0].passed: false`, `results[0].gates.gate1_schema.passed: false` kèm chi tiết `"Options must contain exactly 4 items for task type 'read_fill_blank_4opt' (got 2)"`.
- **Trạng thái:** PASS.

---

## 4. Tổng Kết Danh Sách Bug Đã Sửa (Fix Log)

1. **Fixed (Claude Markdown Parsing):** Cải tiến `splitIntoQuestionBlocks`, `qNumMatch`, `optionLineRegex`, `answerMatch`, `explIdx` và bộ lọc stem trong `src/server/llm/universalQuestionParser.ts` để nhận diện toàn bộ cú pháp Claude Markdown (`### Câu 1`, `**Đề bài:**`, `- **A.**`, `**Đáp án:** A`, `**Giải thích:**`).
2. **Fixed (False Option Match on "Câu"):** Tinh chỉnh `optionLineRegex` bắt buộc phải có dấu phân cách hoặc thẻ đóng `**` ngay sau ký tự phương án để không bao giờ nhận nhầm các từ tiếng Việt như "Câu 1" hay "Chọn" thành phương án C.
3. **Fixed (Text Length Guard):** Bổ sung giới hạn 50,000 ký tự trong `POST /api/qbank/import` (`src/server/qbankRoutes.ts`), trả về HTTP 400 rõ ràng khi vượt quá giới hạn.
4. **Fixed (File Upload Whitelist):** Thêm whitelist định dạng file `['xlsx', 'xls', 'csv', 'docx', 'pdf', 'txt', 'json']` trong `POST /api/qbank/upload-file`, trả về HTTP 400 cho các file không hợp lệ như `.mp3`, `.png`.
5. **Fixed (0-Byte File Guard):** Bổ sung kiểm tra buffer rỗng (`buffer.length === 0`) trong `POST /api/qbank/upload-file`, trả về HTTP 400 `"Tệp tin rỗng (0 byte)."`.
6. **Fixed (10MB File Size Guard):** Bổ sung kiểm tra `buffer.length > 10 * 1024 * 1024` trong `POST /api/qbank/upload-file`, trả về HTTP 400 khi file vượt quá 10MB.
7. **Fixed (Corrupt Binary Crash Safety):** Bọc `extractUploadedFileDetails` trong khối `try/catch` độc lập, ngăn chặn hoàn toàn việc server bị crash khi gặp file nén zip hoặc xml hỏng, luôn trả về HTTP 400 hoặc kết quả an toàn.
8. **Fixed (Dialogue Stem Preservation - Bug 1):** Trong `parseSingleQuestionBlock` (`src/server/llm/universalQuestionParser.ts`), triển khai cơ chế quét trước (pre-scan) phát hiện lượt hội thoại của người nói (`A:`, `B:`, `A：`, `B：`) trước câu hỏi/phương án chính thức; ngăn vòng lặp stem ngắt sớm và giữ nguyên toàn bộ lượt thoại trong `stemLines`, gán đúng `part_type = 'listen_dialogue_qa_4opt'`.
9. **Fixed (Markdown Blockquote Cleaning - Bug 2):** Bổ sung tiền xử lý làm sạch tiền tố markdown blockquote `^[ \t]*>[ \t]?` tại `parseRawTextQuestions`, `splitIntoQuestionBlocks`, và `parseSingleQuestionBlock`, hỗ trợ phân tích đề thi được bọc trong định dạng trích dẫn markdown copy từ ChatGPT/Claude.
10. **Fixed (Markdown `+` Bullet List Support - Bug 3):** Cập nhật `optionLineRegex` từ `(?:[-*•]\s*)?` thành `(?:[-*•+]\s*)?`, hỗ trợ đầy đủ các loại bullet list theo chuẩn CommonMark/Markdown (`-`, `*`, `•`, `+`).
11. **Fixed (Bracketed Pinyin Cleaning - Bug 4):** Cập nhật bộ bóc tách và làm sạch pinyin trong phương án và câu hỏi hỗ trợ đồng thời cả ngoặc đơn `(...)`, ngoặc vuông `[...]` và ngoặc vuông Trung Quốc `【...】` (`[\(\uff08\[\u3010]...[\)\uff09\]\u3011]`). Loại bỏ hoàn toàn việc pinyin trong ngoặc dính vào Hanzi của phương án và không làm ô nhiễm pinyin sinh tự động.

---

## 5. Kết Quả Kiểm Thử Sau Khi Sửa (Milestone M1 Iteration 2)

- **Adversarial Import Test Suite (`tests/adversarial_m1_text_import.test.ts`):** 39/39 tests PASS (100%), chuyển đổi toàn bộ 3 ca `it.fails` (1.3, 1.4, 4.3) thành `it` pass thành công.
- **Full Vitest Import Regression:** 114/114 tests PASS (100%) qua 4 test files:
  - `tests/adversarial_m1_text_import.test.ts` (39 tests)
  - `tests/test_import_edge_cases.test.ts` (15 tests)
  - `tests/adversarial_r3_import_stress.test.ts` (18 tests)
  - `tests/file_upload_comprehensive_cases.test.ts` (42 tests)
- **TypeScript Typecheck:** `npx tsc --noEmit` thoát mã 0 (0 errors).
- **Python Regression Suite:** `python -m pytest tests/test_*.py` đạt 122/122 tests PASS (100%).
- **Database Safety Invariant:** SHA-256 của `data/hsk_exam.db` được bảo toàn nguyên vẹn: `DC299C49A28E11EDB833881952956FF8735EBB8F98844F9F05BE0366E4E357F1`.

