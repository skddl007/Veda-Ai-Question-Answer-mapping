import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useEffect, useRef } from "react";

export function AnswerSheetViewer({
  selected,
  zoom,
  onZoom,
  page,
  onPage,
  showTitle = true,
  answerSheetPages = [],
}) {
  const scrollRef = useRef(null);
  const pageRefs = useRef([]);
  const totalPages = answerSheetPages.length;

  /* Auto-scroll to selected answer box */
  useEffect(() => {
    const box = selected?.boxes?.[0];
    if (!box) return;
    const el = pageRefs.current[box.page - 1];
    const container = scrollRef.current;
    if (!el || !container) return;
    container.scrollTo({ top: el.offsetTop + (el.offsetHeight * box.y) / 100 - 40, behavior: "smooth" });
    onPage(box.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const goToPage = (p) => {
    const next = Math.min(totalPages, Math.max(1, p));
    onPage(next);
    const el = pageRefs.current[next - 1];
    if (el && scrollRef.current) scrollRef.current.scrollTo({ top: el.offsetTop - 8, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl bg-ink">

      {/* ── Dark header bar — matches Figma ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        {showTitle && (
          <p className="truncate text-[15px] font-bold text-ink-foreground">Answer Sheet</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom controls pill */}
          <div className="flex items-center gap-1 rounded-full bg-white/10 px-1 py-1">
            <button
              aria-label="Zoom out"
              onClick={() => onZoom(Math.max(50, zoom - 25))}
              className="grid h-9 w-9 place-items-center rounded-full text-ink-foreground hover:bg-white/10"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-14 text-center text-sm font-bold text-ink-foreground">{zoom}%</span>
            <button
              aria-label="Zoom in"
              onClick={() => onZoom(Math.min(200, zoom + 25))}
              className="grid h-9 w-9 place-items-center rounded-full text-ink-foreground hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Page navigation pill */}
          <div className="flex items-center gap-1 rounded-full bg-white/10 px-1 py-1">
            <button
              aria-label="Previous page"
              onClick={() => goToPage(page - 1)}
              className="grid h-9 w-9 place-items-center rounded-full text-ink-foreground hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-1 text-sm font-bold text-ink-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              aria-label="Next page"
              onClick={() => goToPage(page + 1)}
              className="grid h-9 w-9 place-items-center rounded-full text-ink-foreground hover:bg-white/10"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Answer sheet pages ── */}
      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-auto bg-ink p-2">
        <div style={{ width: `${zoom}%` }} className="mx-auto min-w-full">
          {answerSheetPages.map((src, i) => (
            <div
              key={i}
              ref={(el) => { pageRefs.current[i] = el; }}
              className="relative mb-2 bg-card"
            >
              <img src={src} alt={`Answer sheet page ${i + 1}`} loading="lazy" className="block w-full" />

              {/* Green highlight boxes for selected answer — matches Figma */}
              {selected?.boxes
                ?.filter((b) => b.page === i + 1)
                .map((b, bi) => (
                  <div
                    key={bi}
                    className="absolute rounded-xl border-2 border-success bg-success/15"
                    style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.width}%`, height: `${b.height}%` }}
                  >
                    {/* Green Q label badge — matches Figma */}
                    <span className="absolute -top-3 left-2 rounded-md bg-success px-2 py-0.5 text-xs font-bold text-white">
                      Q{selected.number}{selected.part ?? ""}
                    </span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
