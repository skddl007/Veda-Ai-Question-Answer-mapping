import { ChevronDown } from "lucide-react";

// Figma: full=green, partial=orange, zero=orange, unanswered=gray
const badgeStyles = {
  full: "bg-success-soft text-success-foreground",
  partial: "bg-brand-soft text-brand",
  zero: "bg-brand-soft text-brand",
  unanswered: "bg-secondary text-muted-foreground",
};

export function QuestionCard({ question, selected, expanded, onSelect, onToggle }) {
  const unanswered = question.state === "unanswered";

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={`cursor-pointer rounded-2xl bg-card p-4 shadow-sm transition-colors ${
        selected ? "border-2 border-brand" : "border-2 border-transparent hover:border-border"
      } ${unanswered ? "opacity-80" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-3 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-start">
        {/* Number circle — orange when selected, dark when not */}
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${
              selected
                ? "bg-brand text-brand-foreground"
                : unanswered
                ? "bg-muted-foreground text-ink-foreground"
                : "bg-ink text-ink-foreground"
            }`}
          >
            {question.number}
          </span>
          {question.part && <span className="text-sm font-bold text-muted-foreground">{question.part}</span>}
        </div>

        {/* Question text */}
        <p className="order-last w-full min-w-0 self-center text-[15px] leading-snug text-foreground lg:order-none lg:w-auto">
          {question.text}
        </p>

        {/* Score badge + chevron */}
        <div className="ml-auto flex shrink-0 items-center gap-2 self-center lg:ml-0">
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${badgeStyles[question.state]}`}>
            {unanswered ? "Not answered" : `${question.scored}/${question.total}`}
          </span>
          <button
            aria-label={expanded ? "Collapse feedback" : "Expand feedback"}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* AI Feedback expanded section */}
      {expanded && (
        <div className="mt-3 rounded-2xl bg-secondary p-4">
          <p className="text-[15px] font-bold">AI Feedback</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{question.feedback}</p>
        </div>
      )}
    </div>
  );
}
