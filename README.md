# VedaAI Grade Assistant

> **AI-powered assessment tool** — upload a question paper and a student's handwritten answer sheet, and get back automatically extracted questions, AI grading, per-question scores, feedback, and bounding-box highlights on the answer sheet.

[![Frontend — Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://vercel.com)
[![Backend — Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://render.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Gemini](https://img.shields.io/badge/Gemini-1.5_Flash-4285F4?logo=google&logoColor=white)](https://aistudio.google.com)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [AI Pipeline](#ai-pipeline)
- [Tech Stack](#tech-stack)
- [Getting Started (Local)](#getting-started-local)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)

---

## Overview

VedaAI Grade Assistant solves a real teacher pain-point: manually reading, locating, and scoring handwritten answers is tedious and error-prone. This tool automates the entire pipeline:

1. **Extract** — AI reads the question paper and parses every question, sub-part, and mark allocation
2. **Map** — AI locates each corresponding answer on the student's handwritten answer sheet
3. **Grade** — AI scores each answer and generates 1–3 sentence feedback per question
4. **Highlight** — bounding boxes are returned so the frontend can draw coloured overlays on the exact answer regions

---

## Features

| Feature | Description |
|---|---|
| 📄 **PDF & Image support** | Upload question papers and answer sheets as PDF, JPEG, PNG, WEBP, or TIFF |
| 🤖 **Gemini Vision AI** | Uses Google Gemini 1.5 Flash (multimodal) for OCR + grading |
| 🔄 **Groq fallback** | Automatically falls back to Groq (Llama 3.2 90B Vision) if all Gemini keys are exhausted |
| 🔑 **API key rotation** | Supports up to 3 Gemini API keys (`GEMINI_API_KEY_1/2/3`) with automatic rotation on quota errors |
| 🎯 **Bounding box mapping** | Pixel-accurate highlight boxes returned as `%` of page dimensions — works at any resolution |
| 📊 **Grading states** | Each question is tagged as `full` / `partial` / `zero` / `unanswered` |
| 💬 **AI feedback** | Per-question natural language feedback for the student |
| 📱 **Responsive UI** | Split-pane desktop layout; tab-toggle mobile layout |
| 🚀 **Production-ready** | Dockerised backend, Vercel + Render one-click deploy |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│  React SPA (Vite)  ──  deployed on Vercel           │
│                                                     │
│   Upload Screen  →  Loading Screen  →  Mapping      │
│                         Screen                      │
└──────────────────────────┬──────────────────────────┘
                           │  HTTPS POST /api/process
                           │  (multipart/form-data)
┌──────────────────────────▼──────────────────────────┐
│                FastAPI Backend                      │
│              deployed on Render (Docker)            │
│                                                     │
│  1. Decode PDF/image → PIL Images                   │
│  2. Extract questions  (Gemini Vision)              │
│  3. Map + grade answers (Gemini Vision)             │
│  4. Return JSON: questions + base64 page images     │
└──────────────────────────┬──────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     Google Gemini 1.5 Flash        Groq (fallback)
     (primary, with key rotation)   Llama 3.2 90B Vision
```

---

## Project Structure

```
VedaAI-Grade-Assistant/
│
├── Backend/                        # FastAPI Python backend
│   ├── main.py                     # App entry point, /api/process + /api/health routes
│   ├── ai_service.py               # Gemini/Groq LLM orchestration, prompts, grading pipeline
│   ├── models.py                   # Pydantic models: Question, BoundingBox, ProcessResponse
│   ├── utils.py                    # PDF→image conversion, base64 encoding helpers
│   ├── requirements.txt            # Python dependencies
│   ├── Dockerfile                  # Production Docker image (python:3.11-slim)
│   ├── render.yaml                 # Render Blueprint (IaC)
│   ├── .env.example                # Environment variable template
│   └── .gitignore
│
├── Frontend/                       # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx                 # Top-level state machine: upload → loading → mapping
│   │   ├── main.jsx                # React DOM root
│   │   ├── index.css               # Design tokens, Tailwind base
│   │   ├── components/
│   │   │   ├── AppShell.jsx        # Sidebar (expanded/collapsed) + top navigation bar
│   │   │   ├── UploadScreen.jsx    # File upload dropzone for question paper + answer sheet
│   │   │   ├── LoadingScreen.jsx   # "Extracting…" animated loading state
│   │   │   ├── MappingScreen.jsx   # Split-pane layout: questions list + answer viewer
│   │   │   ├── QuestionCard.jsx    # Individual question row with score, state, AI feedback
│   │   │   └── AnswerSheetViewer.jsx # Zoomable paged viewer with bounding-box overlays
│   │   ├── assets/                 # Logo images
│   │   └── data/                   # (mock.js — used during UI-only development)
│   ├── index.html
│   ├── vite.config.js              # Vite config — dev proxy /api → localhost:8000
│   ├── vercel.json                 # Vercel deploy config + SPA rewrite rules
│   ├── package.json
│   └── .env.example                # VITE_API_BASE_URL template
│
└── .gitignore                      # Root ignore (Figma PNGs, OS files)
```

---

## AI Pipeline

```
Question Paper (PDF/image)          Answer Sheet (PDF/image)
         │                                    │
         ▼                                    ▼
  file_bytes_to_images()           file_bytes_to_images()
  (pypdfium2 for PDF,              (pypdfium2 for PDF,
   Pillow for images)               Pillow for images)
         │                                    │
         ▼                                    │
  STEP 1: extract_questions()                 │
  ─────────────────────────                  │
  Prompt: "Extract every question,            │
  sub-part, and mark allocation"             │
  → Gemini Vision (or Groq fallback)         │
  → returns: [{number, part, text, total}]   │
         │                                    │
         └──────────────┬─────────────────────┘
                        ▼
  STEP 2: extract_and_grade_answers()
  ────────────────────────────────────
  Prompt: inject question list + answer sheet images
  "Find, grade, and locate each answer with
   bounding boxes (% of page)"
  → Gemini Vision (or Groq fallback)
  → returns: [{scored, state, feedback, boxes}]
                        │
                        ▼
  STEP 3: Merge by (number, part)
  → Final: [{id, number, part, text, scored,
             total, state, feedback, boxes}]
                        │
                        ▼
  POST /api/process response:
  { questions: [...], answer_sheet_images: ["data:image/jpeg;base64,..."] }
```

---

## Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| FastAPI | 0.115.6 | REST API framework |
| Uvicorn | 0.32.1 | ASGI server |
| google-generativeai | 0.8.3 | Gemini Vision API |
| groq | latest | Groq API (fallback LLM) |
| pypdfium2 | 4.30.0 | PDF → image rendering |
| Pillow | 11.0.0 | Image processing |
| python-multipart | 0.0.12 | File upload parsing |
| python-dotenv | 1.0.1 | `.env` loading |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| Vite | 5.4.11 | Build tool + dev server |
| Tailwind CSS | 4.1.0 | Utility CSS |
| lucide-react | 0.475.0 | Icon library |
| pdf-lib | 1.17.1 | Client-side PDF utilities |

---

## Getting Started (Local)

### Prerequisites
- Python 3.10+
- Node.js 18+
- A free [Google Gemini API key](https://aistudio.google.com/)
- *(Optional)* A free [Groq API key](https://console.groq.com/keys) for fallback

### 1. Clone the repo

```bash
git clone https://github.com/skddl007/Veda-Ai-Question-Answer-mapping.git
cd Veda-Ai-Question-Answer-mapping
```

### 2. Backend setup

```bash
cd Backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set GEMINI_API_KEY (and optionally GROQ_API_KEY)

# Run the API server
uvicorn main:app --reload --port 8000
```

API available at: `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

### 3. Frontend setup

```bash
cd Frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```

App available at: `http://localhost:5173`

> The Vite dev proxy automatically routes `/api/*` → `http://localhost:8000` — no extra config needed.

### 4. Use the app

1. Open `http://localhost:5173`
2. Upload a **question paper** (PDF or image)
3. Upload a **student answer sheet** (PDF or image)
4. Click **Start Mapping**
5. Review extracted questions, AI scores, feedback, and highlighted answer regions

---

## Deployment

### Backend → Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo, set **Root Directory** to `Backend`
3. Set runtime to **Docker** (auto-detected from `Dockerfile`)
4. Add environment variables in the Render dashboard:

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | Your Gemini API key |
| `GEMINI_MODEL` | `gemini-1.5-flash` |
| `GROQ_API_KEY` | Your Groq API key |
| `ALLOWED_ORIGINS` | Your Vercel frontend URL (set after deploying frontend) |

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import the repo, set **Root Directory** to `Frontend`
3. Add environment variable:

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | Your Render backend URL (e.g. `https://your-app.onrender.com`) |

4. Deploy. Then go back to Render and set `ALLOWED_ORIGINS` to your Vercel URL.

> ⚠️ **Free tier note:** Render free services spin down after 15 min idle. The first request after idle may take ~30 seconds to wake up.

---

## API Reference

### `POST /api/process`

Accepts a multipart form upload and returns graded questions with answer sheet images.

**Request (multipart/form-data):**

| Field | Type | Description |
|---|---|---|
| `question_paper` | File | PDF or image of the question paper |
| `answer_sheet` | File | PDF or image of the student answer sheet |

**Response (JSON):**

```json
{
  "questions": [
    {
      "id": "q1",
      "number": 1,
      "part": null,
      "text": "Define photosynthesis.",
      "scored": 2,
      "total": 2,
      "state": "full",
      "feedback": "Excellent answer. The student correctly identified both light and dark reactions.",
      "boxes": [
        { "page": 1, "x": 5.2, "y": 12.4, "width": 88.1, "height": 8.3 }
      ]
    }
  ],
  "answer_sheet_images": [
    "data:image/jpeg;base64,/9j/4AAQ..."
  ]
}
```

**Question states:**

| State | Meaning |
|---|---|
| `full` | `scored == total` |
| `partial` | `0 < scored < total` |
| `zero` | Student wrote something but scored 0 |
| `unanswered` | No answer found on the sheet |

### `GET /api/health`

```json
{ "status": "ok", "service": "VedaAI Grade Assistant" }
```

---

## Environment Variables

### Backend

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ | — | Primary Google Gemini API key |
| `GEMINI_API_KEY_1` | No | — | Additional Gemini key (rotation) |
| `GEMINI_API_KEY_2` | No | — | Additional Gemini key (rotation) |
| `GEMINI_API_KEY_3` | No | — | Additional Gemini key (rotation) |
| `GEMINI_MODEL` | No | `gemini-1.5-flash` | Gemini model name |
| `GROQ_API_KEY` | No | — | Groq API key (fallback) |
| `GROQ_MODEL` | No | `llama-3.2-90b-vision-preview` | Groq model name |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173,...` | Comma-separated CORS origins |
| `PORT` | No | `8000` | Server port (auto-set by Render) |

### Frontend

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Production only | Full Render backend URL. Empty in local dev (Vite proxy handles it) |

---

## Acknowledgements

- [Google Gemini](https://aistudio.google.com/) — multimodal vision AI
- [Groq](https://groq.com/) — ultra-fast LLM inference (fallback)
- [FastAPI](https://fastapi.tiangolo.com/) — modern Python API framework
- [Vite](https://vitejs.dev/) + [React](https://react.dev/) — frontend tooling
