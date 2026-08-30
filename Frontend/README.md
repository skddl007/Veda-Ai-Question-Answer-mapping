# VedaAI — Grade Assistant (Frontend)

Plain React + Vite implementation of the VedaAI "Upload Question Paper &
Answer Sheets" and "Question ↔ Answer Mapping" screens, built to match
the provided Figma screenshots (desktop + mobile).

This is a clean, framework-free React app — every file is `.jsx`/`.js`,
no TanStack Router/Start, no TypeScript. Data is mocked in
`src/data/mock.js` so the UI can be reviewed end-to-end without a backend.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (defaults to http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Structure

```
src/
  App.jsx                     upload -> loading -> mapping state machine
  main.jsx                    React root
  index.css                   design tokens (colors, radii, font) — oklch, matches Figma
  components/
    AppShell.jsx               sidebar (expanded + collapsed rail) + top bar
    UploadScreen.jsx           "Upload Question Paper & Answer Sheets"
    LoadingScreen.jsx          "Extracting..." state
    MappingScreen.jsx          split-pane (desktop) / tab-toggle (mobile) layout
    QuestionCard.jsx           one row of the extracted-questions list + AI feedback
    AnswerSheetViewer.jsx      zoom/paged answer-sheet viewer with highlight boxes
  data/mock.js                 mock extracted questions + answer sheet pages
  assets/                      teacher illustration, school crest, sample answer sheet
```

## Flow

1. **Upload** — pick a question paper and an answer sheet (any PDF/image;
   this mock reads only the file name/size). "Start Mapping" enables once
   both are attached.
2. **Loading** — a 2.6s "Extracting…" animation, then auto-advances.
3. **Mapping** — extracted questions on one side, the answer sheet on the
   other. Selecting a question scrolls the viewer to and highlights its
   answer region in green; questions with no matching answer are marked
   "Not answered". The back arrow in the top bar returns to Upload.
