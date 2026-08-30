"""
Pydantic models for the VedaAI API request/response shapes.
These mirror the data structures expected by the React frontend.
"""
from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel


class BoundingBox(BaseModel):
    """
    A rectangular region on a specific page of the answer sheet.
    x, y, width, height are expressed as percentages of page dimensions (0-100).
    """
    page: int          # 1-indexed page number
    x: float           # left edge as % of page width
    y: float           # top edge as % of page height
    width: float       # box width as % of page width
    height: float      # box height as % of page height


class Question(BaseModel):
    """
    A single extracted question with grading results and answer mapping.
    Matches the shape consumed by QuestionCard.jsx and AnswerSheetViewer.jsx.
    """
    id: str                                          # e.g. "q1", "q11a"
    number: int                                      # original question number
    part: Optional[str] = None                       # e.g. "a", "b" for sub-parts
    text: str                                        # full question text
    scored: int                                      # marks awarded
    total: int                                       # max marks
    state: Literal["full", "partial", "zero", "unanswered"]
    feedback: str                                    # AI-generated feedback
    boxes: list[BoundingBox]                         # highlighted regions on answer sheet


class ProcessResponse(BaseModel):
    """
    Top-level API response for POST /api/process.
    """
    questions: list[Question]
    # Base64-encoded JPEG images, one per page of the answer sheet.
    # Format: "data:image/jpeg;base64,<data>"
    answer_sheet_images: list[str]
