import { ArrowRight, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import teacher from "../assets/teacher-logo.png";
import { PDFDocument } from "pdf-lib";

function formatSize(bytes) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(0)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

function Dropzone({ label, accent, file, onPick, onClear }) {
  const inputRef = useRef(null);

  return (
    <div className="flex min-h-[200px] flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card p-6">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;

          let pages = "Unknown";
          if (f.type.startsWith("image/")) {
            pages = 1;
          } else if (f.type === "application/pdf") {
            try {
              const arrayBuffer = await f.arrayBuffer();
              const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
              pages = pdfDoc.getPageCount();
            } catch (err) {
              console.error("Failed to parse PDF page count:", err);
            }
          }

          onPick({ rawFile: f, name: f.name, size: formatSize(f.size), pages });
          e.target.value = "";
        }}
      />

      {file ? (
        /* ── Filled state: PDF card — matches Figma filled state ── */
        <div className="relative w-full max-w-sm rounded-2xl bg-secondary px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Red PDF badge matching Figma */}
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-500 text-[11px] font-black text-white">
              PDF
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {file.size} • {file.pages} Pages
              </p>
            </div>
          </div>
          {/* Dark dismiss button — top-right corner */}
          <button
            onClick={onClear}
            aria-label={`Remove ${label}`}
            className="absolute -right-2.5 -top-2.5 grid h-8 w-8 place-items-center rounded-full bg-ink text-ink-foreground shadow-md"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* ── Empty state: Upload prompt ── */
        <button onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center gap-4 py-6">
          {/* Upload icon — white card with border, matches Figma */}
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-card shadow-sm">
            <Upload className="h-5 w-5 text-foreground" />
          </span>
          <span className="text-[17px] font-bold text-foreground">
            Upload <span className="text-brand">{accent}</span>
          </span>
          <span className="text-sm text-muted-foreground">Max 10MB</span>
        </button>
      )}
    </div>
  );
}

export function UploadScreen({ onStart }) {
  const [files, setFiles] = useState({ question: null, answer: null });
  const ready = Boolean(files.question && files.answer);

  return (
    /* Transparent outer — gray page bg shows through, matching Figma */
    <div className="flex min-h-[calc(100dvh-9.5rem)] flex-1 flex-col items-center px-4 py-10 sm:px-8">

      {/* ── Title ── */}
      <h1 className="max-w-5xl text-balance text-center text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[40px]">
        Upload{" "}
        <span className="text-highlight text-brand">Question Paper &amp; Answer Sheets</span>
      </h1>
      <p className="mt-3 text-center text-[15px] text-muted-foreground sm:text-[17px]">
        Upload both files to get started
      </p>

      {/* ── Teacher illustration (ring/orbit baked into image) ── */}
      <div className="mt-8 h-44 w-44 shrink-0 sm:h-52 sm:w-52">
        <img
          src={teacher}
          alt="Teacher illustration"
          loading="lazy"
          width={512}
          height={512}
          className="h-full w-full object-contain"
        />
      </div>

      {/* ── Upload cards wrapper — white card with shadow, matches Figma ── */}
      <div className="mt-8 flex w-full max-w-4xl flex-col gap-4 rounded-3xl bg-card p-5 shadow-sm sm:flex-row">
        <Dropzone
          label="question paper"
          accent="Question Paper"
          file={files.question}
          onPick={(f) => setFiles((s) => ({ ...s, question: f }))}
          onClear={() => setFiles((s) => ({ ...s, question: null }))}
        />
        <Dropzone
          label="answer sheet"
          accent="Answer Sheet"
          file={files.answer}
          onPick={(f) => setFiles((s) => ({ ...s, answer: f }))}
          onClear={() => setFiles((s) => ({ ...s, answer: null }))}
        />
      </div>

      {/* ── Start Mapping button — dark pill when ready, gray pill when disabled ── */}
      <button
        disabled={!ready}
        onClick={() => onStart({ question: files.question?.rawFile, answer: files.answer?.rawFile })}
        className={`mt-8 inline-flex h-12 w-full max-w-[220px] items-center justify-center gap-2 rounded-full px-7 text-[16px] font-semibold transition-colors ${
          ready
            ? "bg-ink text-ink-foreground hover:bg-ink/90"
            : "cursor-not-allowed bg-secondary text-muted-foreground"
        }`}
      >
        Start Mapping <ArrowRight className="h-4 w-4" />
      </button>

      {/* ── Helper text ── */}
      <p className="mt-4 max-w-2xl text-center text-sm text-muted-foreground">
        Once both files are uploaded, you&apos;ll able to map answers with questions
      </p>
    </div>
  );
}
