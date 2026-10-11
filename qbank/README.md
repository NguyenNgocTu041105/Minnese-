# QBank Module (HSK 3.0 Question Bank)

Module độc lập chuyên trách sinh, thẩm định, lưu trữ và đồng bộ câu hỏi luyện thi HSK 3.0.

## 1. Tính năng chính
- Sinh câu hỏi tự động theo blueprint chuẩn HSK 3.0 (HSK 1 - 6).
- Kiểm tra tính hợp lệ đa tầng:
  - Cấu trúc: 4 phương án duy nhất, câu dẫn, giải thích tiếng Việt.
  - Ký tự sạch: Chỉ cho phép chữ Hán, dấu câu chuẩn, chữ số, chỗ trống `____`. Loại bỏ tuyệt đối chữ Latin, tiếng Việt hoặc ghi chú trong ngoặc.
  - Độ dài câu dẫn & phương án: Giới hạn theo từng cấp độ (HSK 1-2 câu ngắn, các phương án cân đối).
  - Tỉ lệ từ vựng vượt cấp: Kiểm tra bằng Jieba đối chiếu với Syllabus tự biên soạn và danh sách tên riêng (`names.txt`).
  - Solver Verification: Độc lập đánh giá từng phương án bằng LLM solver (1 lượt gọi/lô). Gắn cờ `needs_review` nếu có hơn 1 phương án chấp nhận được hoặc sai khác đáp án mục tiêu.
  - Chống trùng lặp (Dedup): Băm nội dung SHA-256 NFC và đối chiếu độ tương đồng câu dẫn (adaptive n-gram).
- Xoay vòng từ vựng: Ưu tiên nạp các từ chưa từng xuất hiện trong DB vào prompt sinh câu hỏi.
- Quản trị qua CLI: `generate`, `review`, `stats`, `syllabus-check`.

## 2. Hướng dẫn CLI

### Sinh câu hỏi
```bash
python -m qbank.cli generate --level 1 --part fill_blank --n 10
# Chạy thử nghiệm không ghi DB:
python -m qbank.cli generate --level 1 --part fill_blank --n 5 --dry-run
```

### Duyệt câu hỏi (Human Review)
```bash
python -m qbank.cli review --level 1
```

### Thống kê kho câu hỏi
```bash
python -m qbank.cli stats
```

### Kiểm tra từ điển Syllabus
```bash
python -m qbank.cli syllabus-check --verbose
```

### Đồng bộ sang bảng questions cũ (Bridge Sync)
```bash
# Mặc định: Dry-run chỉ đọc (không ghi DB cũ)
python -m qbank.cli sync --batch-id batch_xxx

# Thực thi ghi thật vào DB cũ (chỉ đồng bộ câu đã approved)
python -m qbank.cli sync --batch-id batch_xxx --execute
```

### Vô hiệu hóa (Retire / Rollback theo Batch)
```bash
# Chuyển status='rejected' ở DB cũ (exam_service không bốc) và status='retired' ở QBank
python -m qbank.cli retire --batch-id batch_xxx
```

### Xuất câu hỏi đã duyệt (Export)
```bash
# Xuất các câu đã duyệt chưa đồng bộ ra file JSONL (có checksum manifest):
python -m qbank.cli export-approved --out export_hsk1.jsonl --level 1

# Xuất lại cả những câu đã ghi log xuất trước đó:
python -m qbank.cli export-approved --out export_hsk1.jsonl --level 1 --include-exported
```

### Nhập câu hỏi (Import)
> **Lưu ý quan trọng**: Lệnh `import-approved` CHỈ ghi câu hỏi vào kho `qbank.db`, hoàn toàn KHÔNG tự động đồng bộ sang bảng questions cũ.
> Sau khi nhập, người dùng cần chạy lệnh `review` để kiểm duyệt (nếu nạp ở trạng thái `needs_review`) rồi mới chạy `sync` (lệnh riêng biệt, dry-run mặc định) để đồng bộ sang DB cũ.

```bash
# Xem thử trước (Dry-run mặc định, không ghi DB):
python -m qbank.cli import-approved --in export_hsk1.jsonl

# Thực thi ghi thật vào qbank.db (mặc định chuyển thành needs_review để kiểm duyệt):
python -m qbank.cli import-approved --in export_hsk1.jsonl --execute

# Giữ nguyên status='approved' khi nạp nguồn tin cậy:
python -m qbank.cli import-approved --in export_hsk1.jsonl --execute --trust-approved

# Cho phép nạp file thiếu dòng manifest ở cuối:
python -m qbank.cli import-approved --in legacy_file.jsonl --execute --allow-no-manifest
```

### Nhập từ vựng syllabus (import-vocab)
Lệnh nhập từ vựng chuẩn HSK từ CSV/TSV, Excel (.xlsx) hoặc PDF có lớp văn bản (không OCR, không gọi LLM, không mạng):

> **LƯU Ý THIẾT LẬP MÁY MỚI**: File `data/qbank/syllabus/vocab.jsonl` và `vocab_rejected.csv` đã được đưa vào `.gitignore` để không đưa dữ liệu từ điển lớn/có bản quyền vào kho mã nguồn Git. Khi clone sang máy mới, hệ thống tự động dùng file mẫu `vocab.sample.jsonl` (tự biên soạn) cho các bài test và tài liệu. Để tạo kho từ vựng đầy đủ phục vụ sinh đề thi thật, quản trị viên **bắt buộc phải chạy lệnh `import-vocab` với file gốc** trên máy đó.

```bash
# Ví dụ 1: Nạp file từ vựng mẫu tự biên soạn (self-authored):
python -m qbank.cli import-vocab data/sample_vocab.csv --source "Tự biên soạn nội bộ" --license-status self-authored --execute

# Ví dụ 2: Nạp file từ điển chính thức (official) hoặc được cấp phép (permitted):
# (Dry-run mặc định xem trước 10 dòng đầu và thống kê phân bổ level)
python -m qbank.cli import-vocab data/raw_vocab.xlsx --source "Danh mục Giáo dục HSK" --license-status official

# Thực thi ghi thật vào vocab.jsonl (mặc định mode merge, tự động sao lưu và chạy syllabus-check):
python -m qbank.cli import-vocab data/raw_vocab.xlsx --source "Danh mục Giáo dục HSK" --license-status official --execute

# Tùy chọn nâng cao:
# - Cấp độ mặc định: --level 1
# - Ánh xạ cột tùy chỉnh: --map word=Từ,pinyin=Phát_âm,level=Cấp_độ
# - Chọn sheet trong Excel: --sheet HSK_Level1
# - Thay thế toàn bộ thay vì gộp: --mode replace
```

> **CẢNH BÁO BẢN QUYỀN**: Chỉ sử dụng giá trị `--license-status official` hoặc `permitted` khi bạn đã đọc kỹ và xác nhận điều khoản bản quyền của tài liệu nguồn cho phép sử dụng. Nếu là dữ liệu tự viết cho kiểm thử, hãy dùng `--license-status self-authored`. Tuyệt đối không nạp tài liệu không rõ nguồn gốc hoặc bị hạn chế bản quyền.

*Quy trình nạp và sửa lỗi vòng:*
1. Tải danh sách từ vựng từ nguồn bạn đã kiểm tra giấy phép.
2. Chạy lệnh ở chế độ xem trước (mặc định) và so sánh 10 dòng đầu cùng số từ mỗi level với file gốc.
3. Thấy dữ liệu chuẩn thì thêm cờ `--execute`.
4. Nếu có dòng bị loại, mở file `data/qbank/syllabus/vocab_rejected.csv` (đã có sẵn tiêu đề chuẩn `word,pinyin,level`), sửa tay các từ/cấp độ bị sai rồi nạp lại trực tiếp bằng lệnh:
   ```bash
   python -m qbank.cli import-vocab data/qbank/syllabus/vocab_rejected.csv --source "Sửa lỗi thủ công" --license-status self-authored --mode merge --execute
   ```


## 3. Lưu ý Hạn Mức Free Tier Google Gemini

- Endpoint Gemini miễn phí giới hạn số lượt gọi theo ngày (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`, vd. 20-50 requests/ngày tùy model).
- Khi gặp lỗi 429 quota exhaustion (`RESOURCE_EXHAUSTED`), hệ thống sẽ thông báo rõ thời gian chờ (hoặc chuyển sang model còn quota như `gemini-3.5-flash`).

## 4. Lưu ý PostgreSQL Backend
- **Nhánh PostgreSQL**: Nhánh kết nối PostgreSQL trong `db/connection.py` chưa được kiểm chứng trực tiếp do môi trường local dùng SQLite, không có test suite PostgreSQL tự động.
- Lệnh `--execute` trên môi trường phát hiện PostgreSQL bắt buộc phải truyền thêm cờ xác nhận sao lưu: `--i-have-backed-up-postgres`.

