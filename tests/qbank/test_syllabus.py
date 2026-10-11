import os
import tempfile
from qbank.syllabus import QbSyllabus


def test_syllabus_rejects_unknown_and_restricted():
    content = """
{"word": "学校", "pinyin": "xuéxiào", "pos": "n", "level": 1, "topics": ["edu"], "source": "self-authored", "license_status": "self-authored"}
{"word": "老师", "pinyin": "lǎoshī", "pos": "n", "level": 1, "topics": ["edu"], "source": "self-authored", "license_status": "permitted"}
{"word": "非法词", "pinyin": "fēifǎcí", "pos": "n", "level": 1, "topics": ["test"], "source": "scraped", "license_status": "unknown"}
{"word": "受限词", "pinyin": "shòuxiàncí", "pos": "n", "level": 2, "topics": ["test"], "source": "restricted_site", "license_status": "restricted"}
"""
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as f:
        f.write(content)
        temp_file = f.name

    try:
        syllabus = QbSyllabus(vocab_file_path=temp_file)
        # Should only have loaded 2 items (self-authored and permitted)
        assert len(syllabus.items) == 2
        words = [item.word for item in syllabus.items]
        assert "学校" in words
        assert "老师" in words
        assert "非法词" not in words
        assert "受限词" not in words

        # 2 rejected items recorded
        assert len(syllabus.rejected_records) == 2
        rejected_words = [r.get("word") for r in syllabus.rejected_records]
        assert "非法词" in rejected_words
        assert "受限词" in rejected_words
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)


def test_syllabus_level_filtering():
    syllabus = QbSyllabus()
    l1 = syllabus.get_vocab_for_level(1)
    assert len(l1) >= 1
    for item in l1:
        assert item.level == 1


def test_syllabus_missing_license_rejected_and_duplicate_lowest_level():
    content = """
{"word": "朋友", "pinyin": "péngyou", "pos": "n", "level": 3, "source": "self-authored"}
{"word": "朋友", "pinyin": "péngyou", "pos": "n", "level": 1, "source": "self-authored", "license_status": "self-authored"}
{"word": "朋友", "pinyin": "péngyou", "pos": "n", "level": 2, "source": "self-authored", "license_status": "self-authored"}
{"word": "学生", "pinyin": "xuésheng", "pos": "n", "level": 1, "source": "self-authored", "license_status": "self-authored"}
"""
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as f:
        f.write(content)
        temp_file = f.name

    try:
        syllabus = QbSyllabus(vocab_file_path=temp_file)
        # Line 1 (missing license_status) should be rejected
        assert any(r.get("word") == "朋友" and "Disallowed license_status: unknown" in r.get("reason", "") for r in syllabus.rejected_records)
        # Duplicate word "朋友" in levels 1 and 2 should resolve to lowest level 1
        assert syllabus.get_word_level("朋友") == 1
        assert syllabus.get_word_level("学生") == 1
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)


def test_syllabus_check_and_stats():
    content = """
{"word": "电脑", "pinyin": "diànnǎo", "pos": "n", "level": 1, "source": "self-authored", "license_status": "self-authored"}
{"word": "飞机", "pinyin": "fēijī", "pos": "n", "level": 2, "source": "self-authored", "license_status": "self-authored"}
{"word": "无词", "level": 7, "source": "self-authored", "license_status": "self-authored"}
{"pinyin": "wúwén", "level": 1, "source": "self-authored", "license_status": "self-authored"}
{"word": "非法", "level": 1, "source": "self-authored", "license_status": "restricted"}
"""
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as f:
        f.write(content)
        temp_file = f.name

    try:
        syllabus = QbSyllabus(vocab_file_path=temp_file)
        stats = syllabus.get_stats()
        assert stats["total_valid_items"] == 2
        assert stats["by_level"][1] == 1
        assert stats["by_level"][2] == 1
        assert stats["total_rejected"] == 3
        assert any("Invalid level value" in r for r in stats["rejection_summary"])
        assert any("Missing required field 'word'" in r for r in stats["rejection_summary"])
        assert any("Disallowed license_status" in r for r in stats["rejection_summary"])
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)

