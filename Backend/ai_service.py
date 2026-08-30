"""
Gemini AI service for:
  1. Extracting questions from a question paper (images)
  2. Extracting & mapping student answers from an answer sheet (images)
  3. Grading each answer and generating AI feedback

Model: gemini-1.5-flash (free tier, multimodal)
"""
from __future__ import annotations

import json
import re
import os
import time
from typing import Any

import google.generativeai as genai
from groq import Groq
from PIL import Image

from utils import image_to_gemini_part, image_to_base64_uri

# ---------------------------------------------------------------------------
# Gemini client initialisation & key rotation
# ---------------------------------------------------------------------------

_gemini_key_index = 0

def _get_gemini_keys() -> list[str]:
    keys = []
    # Support single key for backward compatibility
    single_key = os.environ.get("GEMINI_API_KEY")
    if single_key:
        keys.append(single_key)
    
    # Check for up to 3 rollover keys (GEMINI_API_KEY_1, _2, _3)
    for i in range(1, 4):
        k = os.environ.get(f"GEMINI_API_KEY_{i}")
        if k and k not in keys:
            keys.append(k)
            
    return keys


# ---------------------------------------------------------------------------
# LLM Orchestration
# ---------------------------------------------------------------------------

def _call_groq(prompt: str, images: list[Image.Image], temperature: float) -> str:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise EnvironmentError("GROQ_API_KEY is not set.")
        
    client = Groq(api_key=api_key)
    model = os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b")
    
    content = [{"type": "text", "text": prompt}]
    for img in images:
        uri = image_to_base64_uri(img)
        content.append({
            "type": "image_url",
            "image_url": {"url": uri}
        })
        
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": content}],
        temperature=temperature,
    )
    return response.choices[0].message.content


def _call_gemini(prompt: str, images: list[Image.Image], temperature: float) -> str:
    global _gemini_key_index
    keys = _get_gemini_keys()
    if not keys:
        raise EnvironmentError("No GEMINI_API_KEYs found in environment. Please set GEMINI_API_KEY_1, etc.")
        
    model_name = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
    parts = [prompt]
    for img in images:
        parts.append({"inline_data": image_to_gemini_part(img)})
        
    last_exception = None
    
    # Try available keys
    for _ in range(len(keys)):
        current_key = keys[_gemini_key_index]
        genai.configure(api_key=current_key)
        model = genai.GenerativeModel(model_name)
        
        try:
            print(f"Trying Gemini API with key index {_gemini_key_index}...")
            response = model.generate_content(
                parts,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=4096,
                )
            )
            return response.text.strip()
        except Exception as e:
            last_exception = e
            print(f"Gemini API key index {_gemini_key_index} failed: {e}. Rotating to next key...")
            # Rotate to next key on failure
            _gemini_key_index = (_gemini_key_index + 1) % len(keys)
            
    raise RuntimeError(f"All Gemini keys failed. Last error: {last_exception}")


def _call_llm(prompt: str, images: list[Image.Image], temperature: float = 0.1) -> str:
    # 1. Try Gemini (Primary with rollover)
    try:
        print("Attempting to use Gemini API...")
        return _call_gemini(prompt, images, temperature)
    except Exception as e:
        print(f"Gemini API failed or exhausted keys: {e}. Falling back to Groq...")
        
    # 2. Fallback to Groq
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if groq_api_key:
        try:
            print("Attempting to use Groq API fallback...")
            return _call_groq(prompt, images, temperature)
        except Exception as e:
            print(f"Groq API fallback also failed: {e}")
            raise
    else:
        raise EnvironmentError("GROQ_API_KEY not found for fallback.")


# ---------------------------------------------------------------------------
# JSON extraction helper
# ---------------------------------------------------------------------------

def _extract_json(text: str) -> Any:
    """
    Pull the first valid JSON object/array out of a possibly markdown-wrapped
    Gemini response (```json ... ``` blocks).
    """
    # Remove <think>...</think> blocks first (from Gemini experimental models)
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    
    # Strip ```json / ``` fences if present
    cleaned = re.sub(r"```(?:json)?\s*", "", text).strip().rstrip("`").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to find the first [ or { and parse from there
        for start_char, end_char in [("[", "]"), ("{", "}")]:
            idx = cleaned.find(start_char)
            if idx != -1:
                # find matching closing bracket
                depth = 0
                for i, ch in enumerate(cleaned[idx:], start=idx):
                    if ch == start_char:
                        depth += 1
                    elif ch == end_char:
                        depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(cleaned[idx : i + 1])
                        except json.JSONDecodeError:
                            break
        raise ValueError(f"Could not extract JSON from Gemini response:\n{text[:500]}")


# ---------------------------------------------------------------------------
# Step 1 — Question extraction
# ---------------------------------------------------------------------------

QUESTION_EXTRACTION_PROMPT = """
You are an expert teacher's assistant. Analyse the provided question paper image(s).

Extract EVERY question in the EXACT order it appears on the paper.
Sub-parts (e.g. "11 a", "11 b") must be treated as SEPARATE entries.

Return a JSON ARRAY where each element is an object with these fields:
{
  "number": <integer — the main question number>,
  "part": <string or null — sub-part label like "a", "b", "i" etc.>,
  "text": <full question text as a string>,
  "total": <integer — marks allocated, parse from the paper; default 2 if not shown>
}

Rules:
- Keep the original numbering (do NOT renumber).
- Include diagram/draw questions as-is.
- Do NOT include any instructions, rubrics, or headers — only questions.
- Output valid JSON only, no markdown fences, no explanation.
"""


def extract_questions(question_paper_images: list[Image.Image]) -> list[dict]:
    """
    Extract all questions from question paper images.
    Returns a list of dicts: [{number, part, text, total}, ...]
    """
    raw = _call_llm(QUESTION_EXTRACTION_PROMPT, question_paper_images, temperature=0.1)
    questions = _extract_json(raw)
    if not isinstance(questions, list):
        if isinstance(questions, dict):
            for v in questions.values():
                if isinstance(v, list):
                    questions = v
                    break
        if not isinstance(questions, list):
            print(f"Failed to extract questions array. Raw AI output:\n{raw}")
            raise ValueError("Expected a JSON array of questions from AI.")
    return questions


# ---------------------------------------------------------------------------
# Step 2 — Answer extraction, mapping & grading
# ---------------------------------------------------------------------------

def _build_answer_extraction_prompt(questions: list[dict], total_pages: int) -> str:
    q_list = "\n".join(
        f'  {i+1}. Q{q["number"]}{""+q["part"] if q.get("part") else ""}: {q["text"]} [{q["total"]} marks]'
        for i, q in enumerate(questions)
    )

    return f"""
You are an expert teacher grading a student's handwritten answer sheet.

The answer sheet has {total_pages} page(s). The images are provided IN ORDER (page 1 first).

Below is the COMPLETE list of questions extracted from the question paper:

{q_list}

Your task:
For EVERY question above, find the student's written answer (if any) on the answer sheet.

CRITICAL BOUNDING BOX RULES — READ CAREFULLY:
- You MUST place the bounding box EXACTLY around the physical text/lines where that specific answer is written.
- Students typically label answers as "Ans 1", "Ans 2", "Q1.", "1.", etc. Use these labels to IDENTIFY which answer belongs to which question.
- The bounding box MUST start at the TOP EDGE of the answer label (e.g. "Ans 4") and end at the BOTTOM EDGE of the last line of that answer's text.
- Do NOT include text from adjacent answers above or below in the same box.
- If Q4's answer is in the MIDDLE of a page, the y% must reflect that middle position — NOT the top or bottom.
- VERIFY your bounding box: mentally check "does this box include ONLY the text for Q{'{number}'}?". If it overlaps with a different answer, correct it.
- Boxes must be TIGHT — avoid large empty regions.

Return a JSON ARRAY — one object per question — with these exact fields:
{{
  "number": <integer — matches question number above>,
  "part": <string or null — matches part label above>,
  "scored": <integer — marks you award, 0 to total>,
  "state": <"full" | "partial" | "zero" | "unanswered">,
  "feedback": <string — 1-3 sentence AI feedback on the answer; if unanswered write "No answer was found on the answer sheet for this question.">,
  "boxes": [
    {{
      "page": <integer — 1-indexed page number where this answer appears>,
      "x": <float — left edge as % of page width, 0-100. Usually around 5-10%>,
      "y": <float — top edge of THIS SPECIFIC answer's text as % of page height, 0-100>,
      "width": <float — width as % of page width. Usually around 80-90%>,
      "height": <float — height covering ONLY this answer's lines as % of page height>
    }}
  ]
}}

Additional rules:
- "state" = "full" when scored == total
- "state" = "partial" when 0 < scored < total
- "state" = "zero" when scored == 0 AND the student DID write something
- "state" = "unanswered" when no answer is present; boxes must be []
- An answer may span multiple pages — include one box per page.
- Include ALL questions even if unanswered.
- Output valid JSON only — no markdown, no explanation.
"""


def extract_and_grade_answers(
    answer_sheet_images: list[Image.Image],
    questions: list[dict],
) -> list[dict]:
    """
    For each question, find its answer on the answer sheet, grade it,
    and return bounding boxes for highlighting.
    Returns a list of dicts matching the Question model shape.
    """
    prompt = _build_answer_extraction_prompt(questions, len(answer_sheet_images))
    raw = _call_llm(prompt, answer_sheet_images, temperature=0.1)
    
    answers = _extract_json(raw)
    if not isinstance(answers, list):
        if isinstance(answers, dict):
            for v in answers.values():
                if isinstance(v, list):
                    answers = v
                    break
        if not isinstance(answers, list):
            print(f"Failed to extract answers array. Raw AI output:\n{raw}")
            raise ValueError("Expected a JSON array of answers from AI.")
    return answers


# ---------------------------------------------------------------------------
# Combined pipeline
# ---------------------------------------------------------------------------

def process_documents(
    question_paper_images: list[Image.Image],
    answer_sheet_images: list[Image.Image],
) -> list[dict]:
    """
    Full pipeline: extract questions → grade answers → merge results.
    Returns a list of question dicts ready to be serialised as Question models.
    """
    # Step 1: Extract questions
    questions = extract_questions(question_paper_images)

    # Step 2: Grade answers against the answer sheet
    graded = extract_and_grade_answers(answer_sheet_images, questions)

    # Step 3: Merge — align by (number, part)
    q_map = {
        (q["number"], q.get("part")): q
        for q in questions
    }

    merged: list[dict] = []
    for i, g in enumerate(graded):
        num = g.get("number", i + 1)
        part = g.get("part") or None
        base = q_map.get((num, part), {})
        text = base.get("text", g.get("text", ""))
        total = base.get("total", g.get("total", 2))

        # Build id
        part_str = str(part).lower() if part else ""
        q_id = f"q{num}{part_str}"

        scored = int(g.get("scored", 0))
        state = g.get("state", "unanswered")

        # Normalise boxes
        boxes = []
        for b in g.get("boxes", []):
            boxes.append({
                "page": int(b.get("page", 1)),
                "x": float(b.get("x", 0)),
                "y": float(b.get("y", 0)),
                "width": float(b.get("width", 80)),
                "height": float(b.get("height", 10)),
            })

        merged.append({
            "id": q_id,
            "number": num,
            "part": part,
            "text": text,
            "scored": scored,
            "total": int(total),
            "state": state,
            "feedback": g.get("feedback", ""),
            "boxes": boxes,
        })

    return merged
