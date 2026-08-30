# VedaAI Grade Assistant — Backend

A Python FastAPI backend that uses **Google Gemini 1.5 Flash** to:
1. Extract questions from a question paper (PDF or image)
2. Map and grade student answers from an answer sheet (PDF or image)
3. Return bounding boxes for highlighting answer regions in the frontend

## Setup

### 1. Prerequisites

- Python 3.10+
- A free Gemini API key from https://aistudio.google.com/

### 2. Install dependencies

```bash
cd Backend
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env and set your GEMINI_API_KEY
```

### 4. Run locally

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

## API

### `POST /api/process`

**Form fields:**
- `question_paper` — PDF or image file
- `answer_sheet` — PDF or image file

**Response:**
```json
{
  "questions": [...],
  "answer_sheet_images": ["data:image/jpeg;base64,..."]
}
```

### `GET /api/health`

Returns `{"status": "ok"}`.

## Deployment (Railway)

1. Push this `Backend/` folder to a GitHub repo
2. Create a new Railway project → Deploy from GitHub
3. Set the `GEMINI_API_KEY` environment variable in Railway settings
4. Set `ALLOWED_ORIGINS` to your deployed frontend URL
5. Railway auto-detects the `Dockerfile` and builds/deploys it

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ | — | Your Google Gemini API key |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000,...` | Comma-separated CORS allowed origins |
| `PORT` | No | `8000` | Port for the server (set automatically by cloud platforms) |
