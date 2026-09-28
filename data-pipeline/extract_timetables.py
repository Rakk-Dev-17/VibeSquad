"""Extract weekday subject schedules from scanned timetable PDFs."""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pdfplumber
from rapidocr_onnxruntime import RapidOCR

PDF_DIR = Path(__file__).resolve().parent / "raw_pdfs"
OUTPUT_FILE = Path(__file__).resolve().parents[1] / "src" / "data" / "timetables.json"
WEEKDAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday")
DAY_ALIASES = {
    "monday": "Monday", "mon": "Monday",
    "tuesday": "Tuesday", "tue": "Tuesday", "tues": "Tuesday",
    "wednesday": "Wednesday", "wed": "Wednesday",
    "thursday": "Thursday", "thu": "Thursday", "thur": "Thursday", "thurs": "Thursday",
    "friday": "Friday", "fri": "Friday",
}
SEMESTER = {
    "startDate": "2026-08-29",
    "endDate": "2026-11-29",
    "holidays": ["2026-10-02", "2026-10-31"],
}
OCR_RESOLUTION = 220


@dataclass(frozen=True)
class OCRWord:
    x1: float
    y1: float
    x2: float
    y2: float
    text: str
    confidence: float

    @property
    def center_x(self) -> float:
        return (self.x1 + self.x2) / 2

    @property
    def center_y(self) -> float:
        return (self.y1 + self.y2) / 2


def normalized(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.casefold())


def ocr_page(page: Any, engine: Any) -> tuple[list[OCRWord], int, int]:
    image = page.to_image(resolution=OCR_RESOLUTION).original
    engine.min_height = 5
    results, _ = engine(np.asarray(image), box_thresh=0.2, text_score=0.2)
    words: list[OCRWord] = []
    for box, text, confidence in results or []:
        xs = [float(point[0]) for point in box]
        ys = [float(point[1]) for point in box]
        words.append(
            OCRWord(
                min(xs), min(ys), max(xs), max(ys),
                str(text).strip(), float(confidence),
            )
        )
    return words, image.width, image.height


def weekday_anchors(words: list[OCRWord], image_width: int) -> dict[str, OCRWord]:
    anchors: dict[str, OCRWord] = {}
    for word in words:
        day = DAY_ALIASES.get(normalized(word.text))
        if day and word.center_x < image_width * 0.4:
            previous = anchors.get(day)
            if previous is None or word.center_x < previous.center_x:
                anchors[day] = word
    return anchors


def group_lines(words: list[OCRWord], vertical_tolerance: float) -> list[list[OCRWord]]:
    lines: list[list[OCRWord]] = []
    for word in sorted(words, key=lambda item: (item.center_y, item.x1)):
        matching_line = next(
            (line for line in reversed(lines) if abs(line[0].center_y - word.center_y) <= vertical_tolerance),
            None,
        )
        if matching_line is None:
            lines.append([word])
        else:
            matching_line.append(word)
    for line in lines:
        line.sort(key=lambda item: item.x1)
    return sorted(lines, key=lambda line: min(word.center_y for word in line))


def extract_slot_legend(words: list[OCRWord], image_width: int) -> dict[str, str]:
    slot_heading = next((word for word in words if normalized(word.text) == "slot"), None)
    name_heading = next(
        (word for word in words if "subjectname" in normalized(word.text)),
        None,
    )
    if slot_heading is None or name_heading is None:
        return {}

    name_x1 = name_heading.x1 - image_width * 0.08
    later_headers = [
        word.center_x
        for word in words
        if word.center_y < name_heading.center_y + image_width * 0.02
        and word.center_x > name_heading.center_x
        and normalized(word.text) in {"credit", "periodsweek", "ltpc", "nameoffaculty", "slot"}
    ]
    name_x2 = min(later_headers, default=max(name_x1 + image_width * 0.28, slot_heading.center_x))
    if name_x2 <= name_x1:
        name_x2 = name_x1 + image_width * 0.25

    subject_codes = [
        word for word in words
        if re.fullmatch(r"[A-Z0-9]{6,}[A-Z]?[.:]?", word.text.upper())
        and any(character.isdigit() for character in word.text)
        and word.center_y > name_heading.center_y
    ]
    subject_codes.sort(key=lambda word: word.center_y)
    if not subject_codes:
        return {}

    slot_words = [
        word for word in words
        if re.fullmatch(r"[A-Ia-i]", word.text)
        and abs(word.center_x - slot_heading.center_x) < image_width * 0.045
    ]
    code_centers = [word.center_y for word in subject_codes]
    slot_to_subject: dict[str, str] = {}
    line_tolerance = image_width * 0.012

    for index, code_word in enumerate(subject_codes):
        previous_gap = code_centers[index] - code_centers[index - 1] if index else (
            code_centers[index + 1] - code_centers[index] if len(code_centers) > 1 else image_width * 0.06
        )
        next_gap = code_centers[index + 1] - code_centers[index] if index + 1 < len(code_centers) else previous_gap
        row_top = code_word.center_y - previous_gap / 2
        row_bottom = code_word.center_y + next_gap / 2

        slot_candidates = [
            word for word in slot_words
            if row_top <= word.center_y < row_bottom
        ]
        if not slot_candidates:
            continue
        slot_word = min(slot_candidates, key=lambda word: abs(word.center_y - code_word.center_y))

        title_words = [
            word for word in words
            if name_x1 <= word.center_x < name_x2
            and row_top <= word.center_y < row_bottom
            and word is not code_word
            and not any(character.isdigit() for character in word.text)
        ]
        title_lines = group_lines(title_words, line_tolerance)
        title = " ".join(" ".join(word.text for word in line) for line in title_lines).strip()
        title = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", title)
        title = re.sub(r"\s+", " ", title).strip(" -:;,.|")
        if title and len(title) > 1:
            slot_to_subject[slot_word.text.upper()] = title

    return slot_to_subject


def vertical_break_columns(words: list[OCRWord], anchors: dict[str, OCRWord], image_width: int) -> list[float]:
    day_words = sorted(anchors.values(), key=lambda word: word.center_y)
    if len(day_words) < 2:
        return []
    typical_gap = sorted(
        day_words[index + 1].center_y - day_words[index].center_y
        for index in range(len(day_words) - 1)
    )[len(day_words) // 2 - 1]
    top = day_words[0].center_y - typical_gap / 2
    bottom = day_words[-1].center_y + typical_gap / 2
    candidates = [
        word for word in words
        if re.fullmatch(r"[A-Z]", word.text.upper())
        and top <= word.center_y <= bottom
    ]
    groups: list[list[OCRWord]] = []
    for word in sorted(candidates, key=lambda item: item.center_x):
        group = next(
            (items for items in groups if abs(items[0].center_x - word.center_x) <= image_width * 0.008),
            None,
        )
        if group is None:
            groups.append([word])
        else:
            group.append(word)

    break_columns: list[float] = []
    for group in groups:
        centers = sorted(word.center_y for word in group)
        close_pairs = sum(
            centers[index + 1] - centers[index] < typical_gap * 0.55
            for index in range(len(centers) - 1)
        )
        if len(centers) >= 4 and close_pairs >= 3:
            break_columns.append(sum(word.center_x for word in group) / len(group))
    return break_columns


def extract_day_schedule(
    words: list[OCRWord],
    anchors: dict[str, OCRWord],
    slot_map: dict[str, str],
    image_width: int,
) -> dict[str, list[str]]:
    schedule = {day: [] for day in WEEKDAYS}
    ordered_anchors = sorted(anchors.items(), key=lambda pair: pair[1].center_y)
    break_columns = vertical_break_columns(words, anchors, image_width)
    for index, (day, anchor) in enumerate(ordered_anchors):
        upper = (ordered_anchors[index - 1][1].center_y + anchor.center_y) / 2 if index else 0
        lower = (anchor.center_y + ordered_anchors[index + 1][1].center_y) / 2 if index + 1 < len(ordered_anchors) else float("inf")
        row_words = [
            word for word in words
            if upper <= word.center_y < lower
            and word.center_x > anchor.x2 + image_width * 0.015
        ]

        code_words = [
            word for word in row_words
            if re.fullmatch(r"[A-Ia-i]", word.text)
            and word.text.upper() in slot_map
            and all(abs(word.center_x - break_x) > image_width * 0.012 for break_x in break_columns)
        ]
        code_words.sort(key=lambda word: word.center_x)
        seen_period_positions: list[float] = []
        for word in code_words:
            if any(abs(word.center_x - seen_x) < image_width * 0.012 for seen_x in seen_period_positions):
                continue
            schedule[day].append(slot_map[word.text.upper()])
            seen_period_positions.append(word.center_x)

        if not schedule[day]:
            known_names = {normalized(name): name for name in slot_map.values()}
            direct_names = [
                word for word in row_words
                if normalized(word.text) in known_names
                and all(abs(word.center_x - break_x) > image_width * 0.012 for break_x in break_columns)
            ]
            for word in sorted(direct_names, key=lambda item: item.center_x):
                schedule[day].append(known_names[normalized(word.text)])
    return schedule


def extract_page_schedule(page: Any, engine: Any, pdf_name: str, page_number: int) -> dict[str, list[str]]:
    words, image_width, _ = ocr_page(page, engine)
    anchors = weekday_anchors(words, image_width)
    missing_days = [day for day in WEEKDAYS if day not in anchors]
    if missing_days:
        missing = ", ".join(missing_days)
        raise ValueError(f"{pdf_name}, page {page_number}: weekday labels not recognized: {missing}.")

    slot_map = extract_slot_legend(words, image_width)
    if not slot_map:
        raise ValueError(f"{pdf_name}, page {page_number}: could not read the subject/slot reference table.")

    schedule = extract_day_schedule(words, anchors, slot_map, image_width)
    empty_days = [day for day in WEEKDAYS if not schedule[day]]
    if empty_days:
        missing = ", ".join(empty_days)
        raise ValueError(f"{pdf_name}, page {page_number}: no mapped period subjects recognized for {missing}.")
    return schedule


def extract_section(pdf_path: Path, engine: Any) -> dict[str, Any]:
    schedule = {day: [] for day in WEEKDAYS}
    with pdfplumber.open(pdf_path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            page_schedule = extract_page_schedule(page, engine, pdf_path.name, page_number)
            for day in WEEKDAYS:
                schedule[day].extend(page_schedule[day])
    return {"sectionId": pdf_path.stem, "schedule": schedule}


def main() -> int:
    pdf_paths = sorted(PDF_DIR.glob("*.pdf"))
    if len(pdf_paths) != 10:
        print(f"Expected 10 timetable PDFs in {PDF_DIR}, found {len(pdf_paths)}.", file=sys.stderr)
        return 1

    engine = RapidOCR()
    try:
        sections = [extract_section(pdf_path, engine) for pdf_path in pdf_paths]
    except (OSError, ValueError, RuntimeError) as error:
        print(f"Timetable extraction stopped: {error}", file=sys.stderr)
        return 1

    result = {"semester": SEMESTER, "sections": sections}
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Extracted {len(sections)} section schedules to {OUTPUT_FILE}")
    for section in sections:
        print(f"{section['sectionId']}: " + ", ".join(f"{day}={len(subjects)}" for day, subjects in section["schedule"].items()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())