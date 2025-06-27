"""Utility functions for parsing CTR/MDR documents using OCR."""

import logging
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


def parse_document(file_path: Path) -> Dict[str, List[Dict[str, str]]]:
    """Parse the provided document and return structured data."""
    text = extract_text(file_path)
    logger.debug("Extracted text: %s", text)
    return parse_text(text)
