from __future__ import annotations

"""Utility functions for parsing project documents."""

import logging
import uuid
from datetime import datetime

DATE_PATTERNS = [
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%m/%d/%Y",
    "%d-%b-%Y",
    "%d-%B-%Y",
]


def _parse_date(value: str) -> str:
    """Parse common date formats and return ISO formatted string."""
    value = str(value).strip()
    for fmt in DATE_PATTERNS:
        try:
            return datetime.strptime(value, fmt).date().isoformat()
        except Exception:
            continue
    logger.debug("Unable to parse date '%s' with known formats", value)
    return value


import re

from pathlib import Path
from typing import Dict, List

try:
    import pytesseract
    from PIL import Image
except Exception:  # pragma: no cover - optional dependency may be missing
    pytesseract = None
    Image = None

try:
    from pdf2image import convert_from_path
except Exception:  # pragma: no cover - optional dependency may be missing
    convert_from_path = None

try:
    import pdfplumber
except Exception:  # pragma: no cover - optional dependency may be missing
    pdfplumber = None

logger = logging.getLogger(__name__)


# ------------------ OCR Helper Functions ------------------


def _ocr_image(image: "Image.Image") -> str:
    if pytesseract is None or Image is None:
        raise RuntimeError("pytesseract is not installed")
    return pytesseract.image_to_string(image)


def extract_text(file_path: Path) -> str:
    """Extract text from an image or PDF using OCR."""
    suffix = file_path.suffix.lower()
    if suffix == ".pdf":
        if convert_from_path is None:
            raise RuntimeError("pdf2image is required to process PDF files")
        images = convert_from_path(str(file_path))
        text = "\n".join(_ocr_image(img) for img in images)
        return text
    else:
        if Image is None:
            raise RuntimeError("Pillow is required for image processing")
        with Image.open(file_path) as img:
            return _ocr_image(img)


def parse_text(text: str) -> Dict[str, List[Dict[str, str]]]:
    """Very naive parser that expects lines in 'task,resource,date' format."""
    tasks: List[Dict[str, str]] = []
    for line in text.splitlines():
        parts = [p.strip() for p in line.split(",") if p.strip()]
        if len(parts) >= 3:
            task_name, resource, date = parts[:3]
            tasks.append(
                {
                    "task": task_name,
                    "resource": resource,
                    "planned_date": _parse_date(date),
                }
            )
        else:
            logger.debug("Skipping malformed line: %s", line)
    return {"tasks": tasks}


# ------------------ Structured Parsers ------------------


def parse_sow_pdf(file_path: Path) -> Dict[str, List[Dict[str, str]]]:
    """Parse a statement-of-work PDF file.

    The parser uses ``pdfplumber`` to extract raw text from the PDF and then
    performs some very lightweight heuristics to identify numbered or bulleted
    items under the main SOW sections. The goal of this parser is not to be
    perfect but to provide structured data that is easy to reason about in
    tests.  Each extracted item becomes a task dictionary with ``task_id``,
    ``title``, ``discipline`` and ``description`` fields.
    """

    if pdfplumber is None:
        logger.warning(
            "pdfplumber not available, falling back to OCR for %s", file_path
        )
        return parse_text(extract_text(file_path))

    text_parts: List[str] = []
    try:
        with pdfplumber.open(str(file_path)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text_parts.append(page_text)
    except Exception as exc:  # pragma: no cover - pdf read failures
        logger.exception("PDF text extraction failed, falling back to OCR: %s", exc)
        return parse_text(extract_text(file_path))

    text = "\n".join(text_parts)

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    tasks: List[Dict[str, str]] = []
    current_section: str | None = None

    section_headers = {
        "INTRODUCTION": "INTRODUCTION",
        "SCOPE OF WORK": "SCOPE OF WORK",
        "CONTRACTOR'S DELIVERABLES": "CONTRACTOR’S DELIVERABLES",
        "CONTRACTOR’S DELIVERABLES": "CONTRACTOR’S DELIVERABLES",
    }

    discipline_map = {
        "mechanical": "Mechanical",
        "electrical": "Electrical",
        "process": "Process",
        "civil": "Civil",
        "structural": "Structural",
        "instrument": "Instrumentation",
        "piping": "Piping",
    }

    for line in lines:
        upper = line.upper()
        if upper in section_headers:
            current_section = section_headers[upper]
            continue

        if current_section is None:
            logger.debug("Skipping line outside section: %s", line)
            continue

        if not (
            line[0].isdigit()
            or line.lstrip().startswith("-")
            or line.lstrip().startswith("•")
        ):
            logger.debug("Skipping non-task line: %s", line)
            continue

        # Remove numbering/bullet characters
        cleaned = line.lstrip("-• ")
        number_match = re.match(r"^(\d+(?:\.\d+)*)\s+(.*)", cleaned)
        if number_match:
            task_id, rest = number_match.groups()
        else:
            task_id = f"{len(tasks)+1}"
            rest = cleaned

        if " - " in rest:
            title, desc = rest.split(" - ", 1)
        elif ":" in rest:
            title, desc = rest.split(":", 1)
        else:
            title, desc = rest, ""

        title = title.strip()
        desc = desc.strip()

        discipline = None
        for key, value in discipline_map.items():
            if key in title.lower():
                discipline = value
                break

        tasks.append(
            {
                "task_id": task_id,
                "title": title,
                "discipline": discipline,
                "description": desc,
            }
        )

    return {"tasks": tasks}


def parse_mdr_excel(file_path: Path) -> Dict[str, List[Dict[str, str]]]:
    """Parse a master deliverable register Excel file.

    This reads all sheets in the workbook using :mod:`pandas` and extracts the
    ``Document Title``, ``Discipline`` and ``Planned Issue Date`` columns. Column
    names are normalised by stripping whitespace and converting to lower case so
    that minor variations in the source file do not matter. Completely empty
    sheets are ignored along with rows that contain no data.
    """

    try:  # Import here so pandas becomes an optional dependency
        import pandas as pd
    except Exception as exc:  # pragma: no cover - optional dependency may be missing
        raise RuntimeError("pandas is required to parse Excel files") from exc

    tasks: List[Dict[str, str]] = []

    xls = pd.ExcelFile(file_path)

    for sheet_name in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet_name)

        # drop completely blank sheets
        if df.dropna(how="all").empty:
            logger.debug("Skipping blank sheet: %s", sheet_name)
            continue

        # normalise column names
        df.columns = [" ".join(str(c).split()).lower() for c in df.columns]

        required = {"document title", "discipline", "planned issue date"}
        if not required.issubset(df.columns):
            # skip sheets without the required headers
            logger.debug("Skipping sheet missing required headers: %s", sheet_name)
            continue

        for idx, row in df.iterrows():
            title = str(row.get("document title", "")).strip()
            discipline = str(row.get("discipline", "")).strip()
            due_raw = row.get("planned issue date")

            if (
                not title
                and not discipline
                and (pd.isna(due_raw) or str(due_raw).strip() == "")
            ):
                logger.debug("Skipping empty row %s in sheet %s", idx, sheet_name)
                continue

            due_date = ""
            if not pd.isna(due_raw) and str(due_raw).strip():
                try:
                    due_date = _parse_date(due_raw)
                except Exception:
                    logger.debug(
                        "Failed to parse date '%s' in row %s of sheet %s",
                        due_raw,
                        idx,
                        sheet_name,
                    )
                    due_date = str(due_raw)

            tasks.append(
                {
                    "task_id": uuid.uuid4().hex,
                    "title": title,
                    "discipline": discipline,
                    "due_date": due_date,
                }
            )

    return {"tasks": tasks}


def parse_ctr_excel(file_path: Path) -> Dict[str, List[Dict[str, str]]]:
    """Parse a cost time resource Excel file.

    The parser reads all sheets in the workbook with :mod:`pandas` and extracts
    the ``Task Name``, ``Duration``, ``Cost`` and ``Resource`` columns.  WBS
    hierarchy is reconstructed from an explicit ``WBS`` column, numeric
    prefixes or indentation in the task name.  Durations and costs are converted
    to numeric types and any date values encountered are normalised to ISO
    format.  Each row becomes a task dictionary with ``task_id`` (the WBS
    identifier), ``title`` (task name without numbering), ``duration``, ``cost``
    and ``resource`` fields.
    """

    try:  # Import here so pandas becomes an optional dependency
        import pandas as pd
    except Exception as exc:  # pragma: no cover - optional dependency may be missing
        raise RuntimeError("pandas is required to parse Excel files") from exc

    tasks: List[Dict[str, str | float]] = []

    xls = pd.ExcelFile(file_path)
    counters: List[int] = []  # used when deriving numbering from indentation

    for sheet_name in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet_name)

        # ignore completely empty sheets
        if df.dropna(how="all").empty:
            logger.debug("Skipping blank sheet: %s", sheet_name)
            continue

        # normalise column names
        df.columns = [" ".join(str(c).split()).lower() for c in df.columns]

        name_col = next((c for c in df.columns if "task name" in c), None)
        if not name_col:
            logger.debug("Skipping sheet %s without task name column", sheet_name)
            continue

        duration_col = next((c for c in df.columns if "duration" in c), None)
        cost_col = next((c for c in df.columns if "cost" in c), None)
        resource_col = next((c for c in df.columns if "resource" in c), None)
        wbs_col = next(
            (c for c in df.columns if "wbs" in c or ("task" in c and "id" in c)),
            None,
        )

        for idx, row in df.iterrows():
            raw_name = str(row.get(name_col, "")).rstrip()
            if not raw_name and all(
                pd.isna(row.get(c)) for c in [duration_col, cost_col]
            ):
                logger.debug("Skipping empty row %s in sheet %s", idx, sheet_name)
                continue

            wbs_code = ""
            title = raw_name

            if wbs_col:
                wbs_raw = row.get(wbs_col)
                if not pd.isna(wbs_raw):
                    wbs_code = str(wbs_raw).strip()

            if not wbs_code:
                match = re.match(r"^(\d+(?:\.\d+)*)\s+(.*)", raw_name)
                if match:
                    wbs_code, title = match.groups()
                    counters = [int(p) for p in wbs_code.split(".")]
                else:
                    indent = len(raw_name) - len(raw_name.lstrip())
                    level = max(indent // 2, 0)
                    if level >= len(counters):
                        counters.extend([0] * (level - len(counters) + 1))
                    counters = counters[: level + 1]
                    counters[level] += 1
                    for i in range(level + 1, len(counters)):
                        counters[i] = 0
                    wbs_code = ".".join(str(c) for c in counters[: level + 1])
                    title = raw_name.strip()

            duration_val = None
            if duration_col:
                duration_val = pd.to_numeric(row.get(duration_col), errors="coerce")
                if pd.api.types.is_timedelta64_dtype(row.get(duration_col)):
                    duration_val = float(
                        pd.to_timedelta(duration_val).dt.total_seconds() / 86400
                    )
                if pd.isna(duration_val):
                    duration_val = None

            cost_val = None
            if cost_col:
                cost_val = pd.to_numeric(row.get(cost_col), errors="coerce")
                if pd.isna(cost_val):
                    cost_val = None

            resource_val = ""
            if resource_col:
                resource_val = str(row.get(resource_col) or "").strip()

            tasks.append(
                {
                    "task_id": wbs_code or uuid.uuid4().hex,
                    "title": title.strip(),
                    "duration": duration_val,
                    "cost": cost_val,
                    "resource": resource_val,
                }
            )

    return {"tasks": tasks}


# ------------------ Dispatching Logic ------------------


def parse_document(file_path: Path) -> Dict[str, List[Dict[str, str]]]:
    """Parse the provided document and return structured data.

    This will attempt to parse the document using a specialized parser based on
    the file extension and name. If the structured parser fails for any reason
    the function falls back to a simple OCR based parser.
    """

    parser = None
    suffix = file_path.suffix.lower()
    name = file_path.name.lower()

    if suffix == ".pdf":
        parser = parse_sow_pdf
    elif suffix == ".xlsx":
        if "ctr" in name:
            parser = parse_ctr_excel
        else:
            # default to MDR if no keyword or explicit "mdr" present
            parser = parse_mdr_excel

    if parser is not None:
        try:
            data = parser(file_path)
            if isinstance(data, dict) and isinstance(data.get("tasks"), list):
                return data
            raise ValueError("Parser did not return expected format")
        except Exception as e:  # pragma: no cover - parser may not be implemented
            logger.exception("Structured parsing failed, falling back to OCR: %s", e)

    # Fallback to OCR parsing
    text = extract_text(file_path)
    logger.debug("Extracted text: %s", text)
    return parse_text(text)
