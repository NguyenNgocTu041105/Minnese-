"""
qbank.blueprint
Module for loading, querying, and managing HSK examination blueprints.
Blueprints define the section and part breakdown, question counts, option counts,
and timing according to official CLEC HSK 3.0 standards.
"""
import os
import re
import json
import logging
from typing import List, Dict, Optional, Any
from pathlib import Path

from qbank.models import QbBlueprint, QbBlueprintSection, QbBlueprintPart

logger = logging.getLogger("qbank.blueprint")

# Determine blueprint directory relative to repository root or module
DEFAULT_BLUEPRINT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data", "qbank", "blueprint")
)


def get_blueprint_dir() -> str:
    """Returns the absolute directory path where blueprint JSON files are located."""
    custom_dir = os.environ.get("QBANK_BLUEPRINT_DIR")
    if custom_dir and os.path.isdir(custom_dir):
        return os.path.abspath(custom_dir)
    return DEFAULT_BLUEPRINT_DIR


def list_blueprints() -> List[int]:
    """
    Scans the blueprint directory and returns a sorted list of available HSK levels.
    """
    bp_dir = get_blueprint_dir()
    if not os.path.isdir(bp_dir):
        return []

    levels = []
    pattern = re.compile(r"^level(\d+)\.json$", re.IGNORECASE)
    for fname in os.listdir(bp_dir):
        m = pattern.match(fname)
        if m:
            try:
                levels.append(int(m.group(1)))
            except ValueError:
                pass
    return sorted(levels)


def load_blueprint(level: int) -> QbBlueprint:
    """
    Loads and validates the exam blueprint for the specified HSK level.

    Raises:
        ValueError: If level is invalid (< 1 or > 6)
        FileNotFoundError: If no blueprint file exists for the requested level
    """
    if not isinstance(level, int) or level < 1 or level > 6:
        raise ValueError(f"Level {level} không hợp lệ. QBank chỉ hỗ trợ HSK từ cấp 1 đến 6.")

    bp_dir = get_blueprint_dir()
    file_path = os.path.join(bp_dir, f"level{level}.json")

    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"Không tìm thấy file blueprint cho HSK {level} tại '{file_path}'.")

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    try:
        raw = json.loads(content)
        bp = QbBlueprint.model_validate(raw)

        # Attach rich metadata from JSON onto the model instances
        for k, v in raw.items():
            if k != "sections":
                object.__setattr__(bp, k, v)

        raw_sections = raw.get("sections", {})
        for s_key, s_obj in bp.sections.items():
            raw_sec = raw_sections.get(s_key, {})
            for k, v in raw_sec.items():
                if k != "parts":
                    object.__setattr__(s_obj, k, v)

            raw_parts = raw_sec.get("parts", {})
            for p_key, p_obj in s_obj.parts.items():
                raw_p = raw_parts.get(p_key, {})
                for k, v in raw_p.items():
                    object.__setattr__(p_obj, k, v)

        return bp
    except Exception as e:
        logger.error(f"Lỗi cú pháp hoặc định dạng trong blueprint HSK {level}: {e}")
        raise ValueError(f"Blueprint HSK {level} không hợp lệ: {e}") from e


def load_blueprint_raw(level: int) -> Dict[str, Any]:
    """
    Loads raw JSON dictionary for an HSK blueprint.
    """
    if not isinstance(level, int) or level < 1 or level > 6:
        raise ValueError(f"Level {level} không hợp lệ. QBank chỉ hỗ trợ HSK từ cấp 1 đến 6.")

    bp_dir = get_blueprint_dir()
    file_path = os.path.join(bp_dir, f"level{level}.json")

    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"Không tìm thấy file blueprint cho HSK {level} tại '{file_path}'.")

    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_section_blueprint(level: int, section_key: str) -> QbBlueprintSection:
    """
    Retrieves the blueprint specification for a specific section within an HSK level.

    Args:
        level: HSK level (1 to 6)
        section_key: Section identifier (e.g. 'listening', 'reading', 'writing')

    Raises:
        ValueError: If level is invalid or blueprint cannot be loaded
        KeyError: If the requested section does not exist in the blueprint
    """
    bp = load_blueprint(level)
    normalized_key = section_key.strip().lower()

    if normalized_key not in bp.sections:
        avail = list(bp.sections.keys())
        raise KeyError(
            f"Phần thi '{section_key}' không tồn tại trong blueprint HSK {level}. "
            f"Các phần khả dụng: {avail}"
        )

    return bp.sections[normalized_key]


def get_part_blueprint(level: int, part_key: str) -> Optional[QbBlueprintPart]:
    """
    Searches for a specific part across all sections of an HSK blueprint.
    Returns the QbBlueprintPart if found, else None.
    """
    bp = load_blueprint(level)
    for section in bp.sections.values():
        if part_key in section.parts:
            return section.parts[part_key]
    return None
