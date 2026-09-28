"""Extract weekday schedules from text-based or scanned timetable PDFs."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

import pdfplumber

PDF_DIR = Path(__file__).resolve().parent / "raw_pdfs"
OUTPUT_FILE = Path(__file__).resolve().parents[1] / "src" / "data" / "timetables.json"
WEEKDAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday")
SEMESTER = {
    "startDate": "2026-08-29",
    "endDate": "2026-11-29",
    "holidays": ["2026-10-02", "2026-10-31"],
}
SUBJECT_CODE_MAP: dict[str, str] = {}
IGNORED_LABELS = {
    "break", "lunch", "lunch break", "tea", "time", "day", "period", "monday",
    "tuesday", "wednesday", "thursday", "friday", "teabre", "teabreak",
}


def clean_subject(value: str) -> str:
    """Normalize OCR/table cell text and reject timetable labels, times, and rooms."""
    subject = re.sub(r"\s+", " ", value).strip(" \t\r\n|;,:.-")
    normalized = subject.casefold()
    if not subject or normalized in IGNORED_LABELS:
        return ""
    if re.search(r"\d", subject):
        return ""
    return SUBJECT_CODE_MAP.get(subject.upper(), subject)


def extract_table_schedule(page: Any) -> dict[str, list[str]]:
    schedule = {day: [] for day in WEEKDAYS}
    for table in page.extract_tables():
        for row in table:
            cells = [str(cell or "").strip() for cell in row]
            day_index = next(
                (index for index, cell in enumerate(cells) if cell.casefold() in {day.casefold() for day in WEEKDAYS}),
                None,
            )
            if day_index is None:
                continue
            day = next(day for day in WEEKDAYS if cells[day_index].casefold() == day.casefold())
            for cell in cells[day_index + 1 :]:
                for line in re.split(r"[\n|;]+", cell):
                    subject = clean_subject(line)
                    if subject and subject not in schedule[day]:
                        schedule[day].append(subject)
    return schedule


def extract_ocr_schedule(page: Any, pdf_name: str) -> dict[str, list[str]]:
    try:
        import pytesseract
        from pytesseract import Output
    except ImportError as error:
        raise RuntimeError(
            f"{pdf_name} is image-only. Install pytesseract and the Tesseract OCR application "
            "to extract its timetable."
        ) from error

    image = page.to_image(resolution=300).original
    words = pytesseract.image_to_data(image, output_type=Output.DICT, config="--psm 6")
    found_days: list[tuple[str, float]] = []
    for index, text in enumerate(words["text"]):
        cleaned = str(text).strip().casefold().rstrip(":")
        if cleaned in {day.casefold() for day in WEEKDAYS}:
            center_y = float(words["top"][index]) + float(words["height"][index]) / 2
            day = next(day for day in WEEKDAYS if day.casefold() == cleaned)
            found_days.append((day, center_y))

    found_days.sort(key=lambda item: item[1])
    if not found_days:
        raise ValueError(f"Could not identify weekday labels in {pdf_name}; no output was written.")

    schedule = {day: [] for day in WEEKDAYS}
    image_height = float(image.height)
    for position, (day, center_y) in enumerate(found_days):
        previous_gap = center_y - found_days[position - 1][1] if position else found_days[1][1] - center_y
        next_gap = found_days[position + 1][1] - center_y if position + 1 < len(found_days) else previous_gap
        upper = (found_days[position - 1][1] + center_y) / 2 if position else max(0, center_y - previous_gap / 2)
        lower = (center_y + found_days[position + 1][1]) / 2 if position + 1 < len(found_days) else min(image_height, center_y + next_gap / 2)
        grouped_lines: dict[tuple[int, int, int], list[tuple[float, str]]] = {}
        for index, raw_text in enumerate(words["text"]):
            text = str(raw_text).strip()
            if not text:
                continue
            top = float(words["top"][index])
            if not upper <= top <= lower:
                continue
            text_center = top + float(words["height"][index]) / 2
            if abs(text_center - center_y) < 18 and text.casefold().rstrip(":") == day.casefold():
                continue
            if int(float(words["conf"][index])) < 25:
                continue
            line_key = (
                int(words["block_num"][index]),
                int(words["par_num"][index]),
                int(words["line_num"][index]),
            )
            grouped_lines.setdefault(line_key, []).append((float(words["left"][index]), text))

        subjects: list[str] = []
        for line in grouped_lines.values():
            line.sort(key=lambda item: item[0])
            chunks: list[str] = []
            previous_x: float | None = None
            for x, text in line:
                if previous_x is not None and x - previous_x > image.width * 0.012:
                    subject = clean_subject(" ".join(chunks))
                    if subject and subject not in subjects:
                        subjects.append(subject)
                    chunks = []
                chunks.append(text)
                previous_x = x
            subject = clean_subject(" ".join(chunks))
            if subject and subject not in subjects:
                subjects.append(subject)
        schedule[day] = subjects

    if all(not subjects for subjects in schedule.values()):
        raise ValueError(f"No subjects were recognized in {pdf_name}; no output was written.")
    return schedule


def extract_section(pdf_path: Path) -> dict[str, Any]:
    schedule = {day: [] for day in WEEKDAYS}
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            page_schedule = extract_table_schedule(page)
            if any(page_schedule.values()):
                for day in WEEKDAYS:
                    for subject in page_schedule[day]:
                        if subject not in schedule[day]:
                            schedule[day].append(subject)
            elif not page_text.strip() and page.images:
                page_schedule = extract_ocr_schedule(page, pdf_path.name)
                for day in WEEKDAYS:
                    for subject in page_schedule[day]:
                        if subject not in schedule[day]:
                            schedule[day].append(subject)
            elif page_text.strip():
                lines = page_text.splitlines()
                for index, line in enumerate(lines):
                    match = re.match(r"^\s*(Monday|Tuesday|Wednesday|Thursday|Friday)\b\s*[:|,-]?\s*(.*)$", line, re.I)
                    if match:
                        day = next(day for day in WEEKDAYS if day.casefold() == match.group(1).casefold())
                        candidates = [match.group(2), *(lines[index + 1 : index + 4])]
                        for candidate in candidates:
                            for part in re.split(r"[|;\t]+", candidate):
                                subject = clean_subject(part)
                                if subject and subject not in schedule[day]:
                                    schedule[day].append(subject)

    if not any(schedule.values()):
        raise ValueError(f"No weekday schedule was extracted from {pdf_path.name}; no output was written.")
    unmapped_codes = sorted(
        {
            subject
            for subjects in schedule.values()
            for subject in subjects
            if re.fullmatch(r"[A-Z]", subject) and subject not in SUBJECT_CODE_MAP
        }
    )
    if unmapped_codes:
        codes = ", ".join(unmapped_codes)
        raise ValueError(
            f"{pdf_path.name} contains subject codes ({codes}) without names. "
            "Add their full titles to SUBJECT_CODE_MAP; no output was written."
        )
    return {"sectionId": pdf_path.stem, "schedule": schedule}


def main() -> int:
    pdf_paths = sorted(PDF_DIR.glob("*.pdf"))
    if not pdf_paths:
        print(f"No PDF files found in {PDF_DIR}", file=sys.stderr)
        return 1

    try:
        sections = [extract_section(pdf_path) for pdf_path in pdf_paths]
    except (OSError, ValueError, RuntimeError) as error:
        print(error, file=sys.stderr)
        return 1

    result = {"semester": SEMESTER, "sections": sections}
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Extracted {len(sections)} section schedules to {OUTPUT_FILE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())