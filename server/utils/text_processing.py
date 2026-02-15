"""
text_processing.py - File Content Extraction
=============================================

Extracts readable text from uploaded files (PDFs).
Images are handled separately via Gemini Vision (multimodal).
"""

import io
import logging

from pypdf import PdfReader

logger = logging.getLogger(__name__)

# File extensions considered images (handled by Gemini Vision, not text extraction).
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"}


def is_image(filename: str) -> bool:
    """Return True if the filename has an image extension."""
    lower = filename.lower()
    return any(lower.endswith(ext) for ext in IMAGE_EXTENSIONS)


def is_pdf(filename: str) -> bool:
    """Return True if the filename has a .pdf extension."""
    return filename.lower().endswith(".pdf")


def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from a PDF file's raw bytes.

    Returns the concatenated text of all pages, or an empty string
    if the PDF contains no extractable text (e.g. scanned images).
    """
    try:
        reader = PdfReader(io.BytesIO(file_content))
        pages: list[str] = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        result = "\n".join(pages).strip()
        if result:
            logger.info("Extracted %d characters from %d PDF pages", len(result), len(reader.pages))
        else:
            logger.warning("PDF contained no extractable text (scanned document?)")
        return result
    except Exception:
        logger.exception("Failed to extract text from PDF")
        return ""
