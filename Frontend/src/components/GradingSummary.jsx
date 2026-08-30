import { useMemo } from "react";

/**
 * GradingSummary
 * Displays a compact evaluation summary card at the top of the results screen.
 *
 * Stats computed:
 *   • Total Score   — sum(scored) / sum(total)
 *   • Percentage    — (totalScored / totalMarks) * 100
 *   • Pass / Fail   — percentage >= 40% → Pass  (standard academic threshold)
 *   • Fully Correct — count of state === "full"
 *   • Partial       — count of state === "partial"
 *   • Zero          — count of state === "zero"
 *   • Unanswered    — count of state === "unanswered"
 */
export function GradingSummary({ questions = [] }) {
  const stats = useMemo(() => {
    const totalScored = questions.reduce((s, q) => s + (q.scored ?? 0), 0);
    const totalMarks  = questions.reduce((s, q) => s + (q.total  ?? 0), 0);
    const pct         = totalMarks > 0 ? Math.round((totalScored / totalMarks) * 100) : 0;
    const passed      = pct >= 40;

    const counts = { full: 0, partial: 0, zero: 0, unanswered: 0 };
    for (const q of questions) counts[q.state] = (counts[q.state] ?? 0) + 1;

    return { totalScored, totalMarks, pct, passed, counts, total: questions.length };
  }, [questions]);

  if (stats.total === 0) return null;

  /* ── Circular progress ring ── */
  const RADIUS   = 28;
  const CIRCUM   = 2 * Math.PI * RADIUS;
  const dashFill = (stats.pct / 100) * CIRCUM;

  const ringColor = stats.passed
    ? "var(--color-success)"
    : stats.pct >= 20
    ? "var(--color-warning)"
    : "var(--color-danger)";

  return (
    <div className="rounded-3xl bg-card px-4 py-3 shadow-sm sm:px-5 sm:py-4">
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">

        {/* ── Score ring + label ── */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="relative h-16 w-16 shrink-0">
            <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90" aria-hidden="true">
              {/* Track */}
              <circle
                cx="36" cy="36" r={RADIUS}
                fill="none"
                stroke="var(--color-secondary)"
                strokeWidth="7"
              />
              {/* Fill */}
              <circle
                cx="36" cy="36" r={RADIUS}
                fill="none"
                stroke={ringColor}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${dashFill} ${CIRCUM}`}
                style={{ transition: "stroke-dasharray 0.8s ease" }}
              />
            </svg>
            {/* Percentage label inside ring */}
            <span
              className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold"
              style={{ color: ringColor }}
            >
              {stats.pct}%
            </span>
          </div>

          {/* Total score + pass/fail pill */}
          <div>
            <p className="text-[22px] font-extrabold leading-none tracking-tight">
              {stats.totalScored}
              <span className="text-base font-semibold text-muted-foreground">
                /{stats.totalMarks}
              </span>
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">Total Score</p>
            <span
              className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                stats.passed
                  ? "bg-success-soft text-success-foreground"
                  : "bg-danger-soft text-danger"
              }`}
            >
              {stats.passed ? "✓ Passed" : "✗ Failed"}
            </span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="hidden h-14 w-px shrink-0 bg-border sm:block" />

        {/* ── Stat grid ── */}
        <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          <StatPill
            label="Fully Correct"
            value={stats.counts.full}
            total={stats.total}
            color="success"
          />
          <StatPill
            label="Partial"
            value={stats.counts.partial}
            total={stats.total}
            color="brand"
          />
          <StatPill
            label="Zero Marks"
            value={stats.counts.zero}
            total={stats.total}
            color="warning"
          />
          <StatPill
            label="Unanswered"
            value={stats.counts.unanswered}
            total={stats.total}
            color="muted"
          />
        </div>

      </div>

      {/* ── Progress bar across full width ── */}
      <BreakdownBar counts={stats.counts} total={stats.total} />
    </div>
  );
}


/* ─── Sub-components ─────────────────────────────────────── */

function StatPill({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  const styles = {
    success: { dot: "bg-success",         text: "text-success-foreground",  badge: "bg-success-soft text-success-foreground" },
    brand:   { dot: "bg-brand",           text: "text-brand",               badge: "bg-brand-soft text-brand" },
    warning: { dot: "bg-warning",         text: "text-warning-foreground",  badge: "bg-warning-soft text-warning-foreground" },
    muted:   { dot: "bg-muted-foreground",text: "text-muted-foreground",    badge: "bg-secondary text-muted-foreground" },
  }[color] ?? {};

  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 shrink-0 rounded-full ${styles.dot}`} />
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="text-[15px] font-extrabold leading-tight">
          {value}
          <span className="ml-1 text-xs font-semibold text-muted-foreground">({pct}%)</span>
        </p>
      </div>
    </div>
  );
}

function BreakdownBar({ counts, total }) {
  if (total === 0) return null;
  const pct = (n) => `${((n / total) * 100).toFixed(1)}%`;

  const segments = [
    { key: "full",       bg: "bg-success",          value: counts.full },
    { key: "partial",    bg: "bg-brand",             value: counts.partial },
    { key: "zero",       bg: "bg-warning",           value: counts.zero },
    { key: "unanswered", bg: "bg-muted-foreground",  value: counts.unanswered },
  ].filter((s) => s.value > 0);

  return (
    <div className="mt-3 overflow-hidden rounded-full bg-secondary" style={{ height: "6px" }}>
      <div className="flex h-full w-full">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className={`h-full ${seg.bg} transition-all duration-700`}
            style={{ width: pct(seg.value) }}
            title={`${seg.key}: ${seg.value}`}
          />
        ))}
      </div>
    </div>
  );
}
