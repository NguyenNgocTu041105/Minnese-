import os
import io
import csv
import json
import pytest
import openpyxl
from unittest.mock import patch

from qbank.vocab_importer import QbVocabImporter
from qbank.cli import handle_import_vocab, build_parser


def test_import_vocab_requires_source_and_license_status(tmp_path):
    csv_file = tmp_path / "sample.csv"
    csv_file.write_text("word,pinyin,level\n测试,cè shì,1\n", encoding="utf-8")

    # Missing source
    with pytest.raises(ValueError, match="Bắt buộc phải cung cấp tham số --source"):
        QbVocabImporter(
            file_path=str(csv_file),
            source="",
            license_status="official"
        )

    # Disallowed license
    with pytest.raises(ValueError, match="không hợp lệ"):
        QbVocabImporter(
            file_path=str(csv_file),
            source="Test Source",
            license_status="unknown"
        )

    # Disallowed level
    with pytest.raises(ValueError, match="Cấp độ --level 7 không hợp lệ"):
        QbVocabImporter(
            file_path=str(csv_file),
            source="Test Source",
            license_status="official",
            default_level=7
        )


def test_import_vocab_csv_auto_detect_columns_and_encoding(tmp_path):
    # Test UTF-8-SIG with Vietnamese headers and semicolon separator
    csv_file = tmp_path / "sample_vn.csv"
    content = "Từ vựng;Phát âm;Cấp độ;Từ loại\n苹果;píng guǒ;1;danh từ\n学校;xué xiào;1;danh từ\n"
    csv_file.write_bytes(content.encode("utf-8-sig"))

    importer = QbVocabImporter(
        file_path=str(csv_file),
        source="Mẫu giáo dục",
        license_status="permitted"
    )
    summary = importer.process(execute=False)

    assert len(summary.valid_items) == 2
    assert summary.valid_items[0].word == "苹果"
    assert summary.valid_items[0].level == 1
    assert summary.valid_items[0].pos == "danh từ"
    assert summary.by_level.get(1) == 2
    assert len(summary.rejected_rows) == 0


def test_import_vocab_gbk_encoding(tmp_path):
    # Test GBK encoding with Chinese headers
    csv_file = tmp_path / "sample_gbk.csv"
    content = "词语,拼音,级别\n老师,lǎo shī,1\n学生,xué sheng,1\n"
    csv_file.write_bytes(content.encode("gbk"))

    importer = QbVocabImporter(
        file_path=str(csv_file),
        source="Tự biên soạn",
        license_status="self-authored"
    )
    summary = importer.process(execute=False)

    assert len(summary.valid_items) == 2
    words = [it.word for it in summary.valid_items]
    assert "老师" in words
    assert "学生" in words


def test_import_vocab_custom_map_and_missing_map_error(tmp_path):
    csv_file = tmp_path / "unnamed_columns.csv"
    csv_file.write_text("Col_A,Col_B,Col_C\n猫,māo,1\n狗,gǒu,1\n", encoding="utf-8")

    # Without map -> must fail
    importer = QbVocabImporter(
        file_path=str(csv_file),
        source="Test",
        license_status="official"
    )
    with pytest.raises(ValueError, match="Không thể tự động nhận diện cột từ tiêu đề"):
        importer.process(execute=False)

    # With custom map
    importer_mapped = QbVocabImporter(
        file_path=str(csv_file),
        source="Test",
        license_status="official",
        column_map="word=Col_A,pinyin=Col_B,level=Col_C"
    )
    summary = importer_mapped.process(execute=False)
    assert len(summary.valid_items) == 2
    assert summary.valid_items[0].word == "猫"


def test_import_vocab_section_header_level_detection(tmp_path):
    # CSV with section headers instead of level column
    csv_file = tmp_path / "sections.csv"
    content = (
        "Word,Pinyin\n"
        "HSK 1\n"
        "茶,chá\n"
        "水,shuǐ\n"
        "二级\n"
        "唱歌,chàng gē\n"
        "HSK 3\n"
        "音乐,yīn yuè\n"
    )
    csv_file.write_text(content, encoding="utf-8")

    importer = QbVocabImporter(
        file_path=str(csv_file),
        source="Syllabus Test",
        license_status="official"
    )
    summary = importer.process(execute=False)

    assert len(summary.valid_items) == 4
    word_map = {it.word: it.level for it in summary.valid_items}
    assert word_map["茶"] == 1
    assert word_map["水"] == 1
    assert word_map["唱歌"] == 2
    assert word_map["音乐"] == 3


def test_import_vocab_xlsx_sheets(tmp_path):
    xlsx_file = tmp_path / "vocab_test.xlsx"
    wb = openpyxl.Workbook()

    # Active sheet (Sheet)
    ws1 = wb.active
    ws1.title = "DefaultSheet"
    ws1.append(["词语", "拼音", "等级"])
    ws1.append(["米饭", "mǐ fàn", 1])

    # Custom sheet
    ws2 = wb.create_sheet(title="HSK2_List")
    ws2.append(["Word", "Pinyin", "Level"])
    ws2.append(["跑步", "pǎo bù", 2])

    wb.save(xlsx_file)

    # Read specific sheet
    importer = QbVocabImporter(
        file_path=str(xlsx_file),
        source="Excel Test",
        license_status="permitted",
        sheet_name="HSK2_List"
    )
    summary = importer.process(execute=False)
    assert len(summary.valid_items) == 1
    assert summary.valid_items[0].word == "跑步"
    assert summary.valid_items[0].level == 2

    # Non-existent sheet
    importer_bad = QbVocabImporter(
        file_path=str(xlsx_file),
        source="Excel Test",
        license_status="permitted",
        sheet_name="NonExistent"
    )
    with pytest.raises(ValueError, match="Sheet 'NonExistent' không tồn tại"):
        importer_bad.process(execute=False)


def test_import_vocab_pdf_text_and_scanned_error(tmp_path):
    # Minimal PDF with text layer
    pdf_text_file = tmp_path / "has_text.pdf"
    pdf_bytes = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 50 >> stream
BT
/F1 12 Tf
100 700 Td
(Word Pinyin Level) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000244 00000 n 
0000000345 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
419
%%EOF"""
    pdf_text_file.write_bytes(pdf_bytes)

    # PDF with no text stream (simulating scanned PDF)
    pdf_scanned_file = tmp_path / "scanned.pdf"
    scanned_bytes = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj
xref
0 4
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
trailer << /Size 4 /Root 1 0 R >>
startxref
190
%%EOF"""
    pdf_scanned_file.write_bytes(scanned_bytes)

    # Test scanned error
    importer_scanned = QbVocabImporter(
        file_path=str(pdf_scanned_file),
        source="Scan",
        license_status="official"
    )
    with pytest.raises(ValueError, match="PDF không có lớp văn bản"):
        importer_scanned.process(execute=False)


def test_import_vocab_validation_and_rejected_csv(tmp_path):
    csv_file = tmp_path / "dirty.csv"
    rej_csv = tmp_path / "vocab_rejected.csv"
    # Row with latin, row with missing level, row with level 9
    content = (
        "Từ,Pinyin,Level\n"
        "书,shū,1\n"
        "水 needle,shuǐ,1\n"
        "飞机,fēi jī,9\n"
        ",kōng,1\n"
    )
    csv_file.write_text(content, encoding="utf-8")

    importer = QbVocabImporter(
        file_path=str(csv_file),
        source="Dirty Source",
        license_status="official",
        rejected_csv_path=str(rej_csv)
    )
    summary = importer.process(execute=False)

    assert len(summary.valid_items) == 1
    assert summary.valid_items[0].word == "书"
    assert len(summary.rejected_rows) == 3

    assert rej_csv.exists()
    rej_content = rej_csv.read_text(encoding="utf-8-sig")
    assert "word,pinyin,level" in rej_content
    assert "水 needle" in rej_content
    assert "chữ Hán" in rej_content
    assert "cấp độ HSK" in rej_content


def test_import_vocab_rejected_csv_roundtrip_merge(tmp_path):
    dirty_csv = tmp_path / "dirty_initial.csv"
    rej_csv = tmp_path / "vocab_rejected.csv"
    target_vocab = tmp_path / "vocab.jsonl"

    # Step 1: Initial import with a dirty entry
    dirty_content = (
        "Word,Pinyin,Level\n"
        "猫,māo,1\n"
        "水 needle,shuǐ,1\n"
    )
    dirty_csv.write_text(dirty_content, encoding="utf-8")

    importer = QbVocabImporter(
        file_path=str(dirty_csv),
        source="Initial",
        license_status="official",
        target_vocab_path=str(target_vocab),
        rejected_csv_path=str(rej_csv)
    )
    res1 = importer.process(execute=True)
    assert res1.saved_count == 1
    assert len(res1.rejected_rows) == 1

    # Step 2: Verify rejected file headers and content
    assert rej_csv.exists()
    rows = list(csv.reader(io.StringIO(rej_csv.read_text(encoding="utf-8-sig"))))
    assert rows[0] == ["word", "pinyin", "level", "reason", "line_number", "raw_row"]
    assert rows[1][0] == "水 needle"

    # Step 3: Simulate user fixing the rejected CSV file
    fixed_rows = [
        rows[0],  # Header: word, pinyin, level, reason, line_number, raw_row
        ["水", rows[1][1], rows[1][2], "Đã sửa", rows[1][4], rows[1][5]]  # Fixed "水 needle" -> "水"
    ]
    fixed_csv = tmp_path / "fixed_rejected.csv"
    with open(fixed_csv, "w", encoding="utf-8-sig", newline="") as f:
        csv.writer(f).writerows(fixed_rows)

    # Step 4: Re-import fixed file using mode merge
    importer_merge = QbVocabImporter(
        file_path=str(fixed_csv),
        source="Manual Fix",
        license_status="official",
        mode="merge",
        target_vocab_path=str(target_vocab)
    )
    res2 = importer_merge.process(execute=True)
    assert res2.saved_count == 1
    assert len(res2.rejected_rows) == 0

    # Verify both 猫 and 水 are in target vocab.jsonl
    final_items = [json.loads(line) for line in target_vocab.read_text(encoding="utf-8").splitlines() if line.strip()]
    assert len(final_items) == 2
    words = {it["word"]: it["level"] for it in final_items}
    assert "猫" in words
    assert "水" in words
    assert words["水"] == 1




def test_import_vocab_pinyin_warning_not_rejected(tmp_path):
    csv_file = tmp_path / "pinyin_warn.csv"
    # Provide divergent pinyin "ni3 hao3"
    content = "Word,Pinyin,Level\n你好,hello_pinyin,1\n"
    csv_file.write_text(content, encoding="utf-8")

    importer = QbVocabImporter(
        file_path=str(csv_file),
        source="Pinyin Test",
        license_status="official"
    )
    summary = importer.process(execute=False)

    # Word must be accepted, with a warning generated
    assert len(summary.valid_items) == 1
    assert summary.valid_items[0].word == "你好"
    assert len(summary.warnings) >= 1
    assert "hello_pinyin" in summary.warnings[0]


def test_import_vocab_dry_run_vs_execute_merge_and_replace(tmp_path):
    target_vocab = tmp_path / "vocab.jsonl"
    rej_csv = tmp_path / "vocab_rejected.csv"

    # Pre-populate vocab.jsonl with a word at Level 2
    pre_item = {
        "word": "苹果",
        "pinyin": "píng guǒ",
        "pos": "n",
        "level": 2,
        "topics": [],
        "source": "pre",
        "license_status": "official"
    }
    target_vocab.write_text(json.dumps(pre_item, ensure_ascii=False) + "\n", encoding="utf-8")

    # Import file having 苹果 at Level 1 (lowest level rule) and a new word 电脑 at Level 2
    import_csv = tmp_path / "batch.csv"
    import_csv.write_text("Word,Pinyin,Level\n苹果,píng guǒ,1\n电脑,diàn nǎo,2\n", encoding="utf-8")

    # 1. DRY-RUN: Must not change target file
    importer_dry = QbVocabImporter(
        file_path=str(import_csv),
        source="Update",
        license_status="official",
        target_vocab_path=str(target_vocab),
        rejected_csv_path=str(rej_csv)
    )
    summary_dry = importer_dry.process(execute=False)
    assert len(summary_dry.valid_items) == 2
    # Verify file content still has only 1 pre-populated item at Level 2
    lines = [json.loads(line) for line in target_vocab.read_text(encoding="utf-8").splitlines() if line.strip()]
    assert len(lines) == 1
    assert lines[0]["level"] == 2

    # 2. EXECUTE MERGE: updates 苹果 to level 1 and adds 电脑
    importer_merge = QbVocabImporter(
        file_path=str(import_csv),
        source="Update",
        license_status="official",
        mode="merge",
        target_vocab_path=str(target_vocab),
        rejected_csv_path=str(rej_csv)
    )
    summary_merge = importer_merge.process(execute=True)
    assert summary_merge.saved_count == 2
    assert summary_merge.backup_file is not None
    assert os.path.exists(summary_merge.backup_file)

    merged_lines = [json.loads(line) for line in target_vocab.read_text(encoding="utf-8").splitlines() if line.strip()]
    merged_map = {it["word"]: it["level"] for it in merged_lines}
    assert len(merged_lines) == 2
    assert merged_map["苹果"] == 1  # Lowest level kept!
    assert merged_map["电脑"] == 2

    # 3. EXECUTE REPLACE: with a file containing only 手机 at Level 3
    replace_csv = tmp_path / "replace.csv"
    replace_csv.write_text("Word,Pinyin,Level\n手机,shǒu jī,3\n", encoding="utf-8")

    importer_replace = QbVocabImporter(
        file_path=str(replace_csv),
        source="Replace",
        license_status="official",
        mode="replace",
        target_vocab_path=str(target_vocab),
        rejected_csv_path=str(rej_csv)
    )
    summary_rep = importer_replace.process(execute=True)
    assert summary_rep.saved_count == 1

    replaced_lines = [json.loads(line) for line in target_vocab.read_text(encoding="utf-8").splitlines() if line.strip()]
    assert len(replaced_lines) == 1
    assert replaced_lines[0]["word"] == "手机"
    assert replaced_lines[0]["level"] == 3


def test_import_vocab_cli_execution_and_auto_syllabus_check(tmp_path, capsys):
    csv_file = tmp_path / "cli_vocab.csv"
    target_vocab = tmp_path / "vocab_cli.jsonl"
    csv_file.write_text("Word,Pinyin,Level\n北京,běi jīng,1\n", encoding="utf-8")

    parser = build_parser()
    args = parser.parse_args([
        "import-vocab",
        str(csv_file),
        "--source", "CLI Test Source",
        "--license-status", "official",
        "--target-vocab-path", str(target_vocab),
        "--execute"
    ])

    ret = handle_import_vocab(args)
    assert ret == 0

    out = capsys.readouterr().out
    assert "NHẬP TỪ VỰNG SYLLABUS HSK 3.0" in out
    assert "北京" in out
    assert "HSK 1:     1 từ" in out
    assert "KIỂM TRA TỪ ĐIỂN SYLLABUS HSK 3.0" in out
    assert target_vocab.exists()

