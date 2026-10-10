import os
import uuid
import logging
from typing import Dict, List, Any
from pypdf import PdfReader

logger = logging.getLogger("astra.rag.document_loader")

def load_pdf_document(file_path: str) -> Dict[str, Any]:
    """
    Safely loads and extracts page-level text from a local PDF file using pypdf.
    Preserves exact page numbers (1-indexed) and handles empty or non-extractable pages explicitly.
    
    Args:
        file_path: Absolute or relative path to the PDF file.
        
    Returns:
        Dict containing document metadata and structured page objects.
    """
    if not file_path or not isinstance(file_path, str):
        raise ValueError("File path must be a non-empty string.")

    abs_path = os.path.abspath(file_path)

    if not os.path.exists(abs_path):
        raise FileNotFoundError(f"PDF file not found at path: '{abs_path}'")

    if not os.path.isfile(abs_path):
        raise ValueError(f"Path is not a file: '{abs_path}'")

    if not abs_path.lower().endswith(".pdf"):
        raise ValueError(f"Invalid file type for '{os.path.basename(abs_path)}'. Only '.pdf' files are accepted.")

    if os.path.getsize(abs_path) == 0:
        raise ValueError(f"PDF file is empty (0 bytes): '{os.path.basename(abs_path)}'")

    try:
        reader = PdfReader(abs_path)
    except Exception as e:
        logger.error(f"Failed to parse PDF '{os.path.basename(abs_path)}': {str(e)}")
        raise ValueError(f"Unreadable or corrupted PDF file: '{os.path.basename(abs_path)}'. Error: {str(e)}")

    page_count = len(reader.pages)
    if page_count == 0:
        raise ValueError(f"PDF file contains no pages: '{os.path.basename(abs_path)}'")

    pages: List[Dict[str, Any]] = []

    for idx, page in enumerate(reader.pages, start=1):
        try:
            extracted = page.extract_text()
        except Exception as err:
            logger.warning(f"Text extraction failed on page {idx} of '{os.path.basename(abs_path)}': {err}")
            extracted = None

        if extracted is not None:
            text = extracted.strip()
            has_text = len(text) > 0
        else:
            text = ""
            has_text = False

        pages.append({
            "page_number": idx,
            "text": text,
            "has_text": has_text,
            "character_count": len(text)
        })

    document_id = f"doc_{uuid.uuid4().hex[:12]}"
    filename = os.path.basename(abs_path)
    total_chars = sum(p["character_count"] for p in pages)

    logger.info(f"Successfully loaded PDF '{filename}': {page_count} pages, {total_chars} total characters extracted.")

    return {
        "document_id": document_id,
        "original_filename": filename,
        "file_path": abs_path,
        "page_count": page_count,
        "total_characters": total_chars,
        "pages": pages
    }
