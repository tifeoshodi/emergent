from __future__ import annotations
"""Utility functions for parsing project documents."""

import logging
import uuid
from datetime import datetime
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
        parts = [p.strip() for p in line.split(',') if p.strip()]
        if len(parts) >= 3:
            task_name, resource, date = parts[:3]
            tasks.append({
                "task": task_name,
                "resource": resource,
                "planned_date": date,
            })
    return {"tasks": tasks}


# ------------------ Structured Parsers ------------------

def parse_sow_pdf(file_path: Path) -> Dict[str, List[Dict[str, str]]]:
    """Parse a statement-of-work PDF file."""
    raise NotImplementedError("PDF parser not implemented")


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
            continue

        # normalise column names
        df.columns = [" ".join(str(c).split()).lower() for c in df.columns]

        required = {"document title", "discipline", "planned issue date"}
        if not required.issubset(df.columns):
            # skip sheets without the required headers
            continue

        for _, row in df.iterrows():
            title = str(row.get("document title", "")).strip()
            discipline = str(row.get("discipline", "")).strip()
            due_raw = row.get("planned issue date")

            if not title and not discipline and (pd.isna(due_raw) or str(due_raw).strip() == ""):
                continue

            due_date = ""
            if not pd.isna(due_raw) and str(due_raw).strip():
                try:
                    parsed = pd.to_datetime(due_raw)
                    if isinstance(parsed, datetime):
                        due_date = parsed.date().isoformat()
                    else:
                        due_date = parsed.isoformat()
                except Exception:
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
    """Parse a cost time resource Excel file."""
    raise NotImplementedError("CTR Excel parser not implemented")


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
