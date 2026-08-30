"""
VedaAI Grade Assistant — FastAPI backend entry point.

Endpoints:
  POST /api/process   — Upload question paper + answer sheet; returns graded questions
  GET  /api/health    — Liveness probe
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env file if present (dev convenience)
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from ai_service import process_documents
from models import ProcessResponse, Question, BoundingBox
from utils import file_bytes_to_images, image_to_base64_uri

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="VedaAI Grade Assistant API",
    description="Extracts questions from a question paper and maps/grades student answers from an answer sheet using Google Gemini.",
    version="1.0.0",
)

# CORS — allow the Vite dev server and any deployed frontend origin.
# In production set ALLOWED_ORIGINS to the exact deployed URL.
_raw_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:4173,http://127.0.0.1:3000",
)
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health() -> dict:
    """Liveness probe."""
    return {"status": "ok", "service": "VedaAI Grade Assistant"}


@app.post("/api/process", response_model=ProcessResponse)
async def process(
    question_paper: UploadFile = File(..., description="Question paper — PDF or image"),
    answer_sheet: UploadFile = File(..., description="Answer sheet — PDF or image"),
) -> ProcessResponse:
    """
    Full pipeline:
    1. Decode uploaded files to images
    2. Extract questions from the question paper (Gemini vision)
    3. Map and grade answers on the answer sheet (Gemini vision)
    4. Return structured JSON with questions + base64 answer sheet images
    """
    # --- Validate MIME types ---
    allowed_mime = {
        "application/pdf",
        "image/jpeg", "image/jpg", "image/png",
        "image/webp", "image/gif", "image/bmp", "image/tiff",
    }
    for upload in (question_paper, answer_sheet):
        ct = (upload.content_type or "").split(";")[0].strip().lower()
        if ct and ct not in allowed_mime:
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type '{ct}'. Please upload a PDF or image.",
            )

    # --- Read bytes ---
    try:
        qp_bytes = await question_paper.read()
        as_bytes = await answer_sheet.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded files: {exc}") from exc

    if not qp_bytes:
        raise HTTPException(status_code=400, detail="question_paper is empty.")
    if not as_bytes:
        raise HTTPException(status_code=400, detail="answer_sheet is empty.")

    # --- Decode to PIL images ---
    try:
        qp_images = file_bytes_to_images(qp_bytes, question_paper.filename or "")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"question_paper: {exc}") from exc

    try:
        as_images = file_bytes_to_images(as_bytes, answer_sheet.filename or "")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"answer_sheet: {exc}") from exc

    # --- AI processing ---
    try:
        raw_questions = process_documents(qp_images, as_images)
    except EnvironmentError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=502,
            detail=f"AI processing failed: {exc}",
        ) from exc

    # --- Build response models ---
    questions: list[Question] = []
    for rq in raw_questions:
        boxes = [BoundingBox(**b) for b in rq.get("boxes", [])]
        questions.append(
            Question(
                id=rq["id"],
                number=rq["number"],
                part=rq.get("part"),
                text=rq["text"],
                scored=rq["scored"],
                total=rq["total"],
                state=rq["state"],
                feedback=rq["feedback"],
                boxes=boxes,
            )
        )

    # --- Encode answer sheet pages as base64 data-URIs ---
    answer_sheet_images = [image_to_base64_uri(img) for img in as_images]

    return ProcessResponse(
        questions=questions,
        answer_sheet_images=answer_sheet_images,
    )
