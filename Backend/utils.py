"""
Utility helpers: PDF → image conversion and image encoding.
"""
from __future__ import annotations
import base64
import io
from typing import Optional

from PIL import Image


# ---------------------------------------------------------------------------
# PDF → PIL images
# ---------------------------------------------------------------------------

def pdf_to_images(file_bytes: bytes, dpi: int = 150) -> list[Image.Image]:
    """
    Convert every page of a PDF to a PIL Image using pypdfium2.
    Returns an empty list if the file is not a valid PDF.
    """
    try:
        import pypdfium2 as pdfium  # lazy import to avoid crashing on image-only uploads
        pdf = pdfium.PdfDocument(file_bytes)
        images: list[Image.Image] = []
        scale = dpi / 72  # pdfium uses 72 DPI internally
        for page in pdf:
            bitmap = page.render(scale=scale, rotation=0)
            pil_image = bitmap.to_pil()
            images.append(pil_image.convert("RGB"))
        return images
    except Exception:
        return []


def file_bytes_to_images(file_bytes: bytes, filename: str = "") -> list[Image.Image]:
    """
    Auto-detect whether the upload is a PDF or an image and return
    a list of PIL Images (one per page/frame).
    """
    lower = filename.lower()
    is_pdf = lower.endswith(".pdf") or file_bytes[:4] == b"%PDF"

    if is_pdf:
        imgs = pdf_to_images(file_bytes)
        if imgs:
            return imgs
        # Fall through if pypdfium2 fails — maybe the bytes are actually an image
    
    # Try to open as a standard image (JPEG, PNG, WEBP, etc.)
    try:
        img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        frames: list[Image.Image] = []
        try:
            while True:
                frames.append(img.copy())
                img.seek(img.tell() + 1)
        except EOFError:
            pass
        return frames if frames else [img]
    except Exception as exc:
        raise ValueError(f"Cannot decode file as PDF or image: {exc}") from exc


# ---------------------------------------------------------------------------
# Image → base64 data-URI
# ---------------------------------------------------------------------------

def image_to_base64_uri(img: Image.Image, quality: int = 85) -> str:
    """Encode a PIL Image as a JPEG base64 data-URI for the frontend."""
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality, optimize=True)
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{encoded}"


def image_to_gemini_part(img: Image.Image, quality: int = 85) -> dict:
    """
    Encode a PIL Image as an inline_data dict suitable for the Gemini API
    (genai.types.Part.from_bytes style, but as a raw dict for flexibility).
    """
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality, optimize=True)
    return {
        "mime_type": "image/jpeg",
        "data": base64.b64encode(buf.getvalue()).decode("utf-8"),
    }
