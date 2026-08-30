import { useMemo, useState } from "react";
import { QuestionCard } from "./QuestionCard.jsx";
import { AnswerSheetViewer } from "./AnswerSheetViewer.jsx";
import { GradingSummary } from "./GradingSummary.jsx";

export function MappingScreen({ results }) {
  const questions = results?.questions || [];
  const answerSheetPages = results?.answer_sheet_images || [];
  const firstId = questions.length > 0 ? questions[0].id : null;

  const [selectedId, setSelectedId] = useState(firstId);
  const [expanded, setExpanded] = useState(firstId ? { [firstId]: true } : {});
  const [tab, setTab] = useState("questions");
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);

  const selected = useMemo(() => questions.find((q) => q.id === selectedId) ?? null, [selectedId, questions]);
  const allExpanded = questions.length > 0 && questions.every((q) => expanded[q.id]);

  const toggleAll = () =>
    setExpanded(allExpanded ? {} : Object.fromEntries(questions.map((q) => [q.id, true])));

  const selectQuestion = (id) => {
    setSelectedId(id);
    const q = questions.find((x) => x.id === id);
    if (q?.boxes?.length) setTab("answers");
  };

  /* ── Left panel: question list ── */
  const questionList = (
    <div className="flex min-h-0 flex-1 flex-col rounded-3xl bg-secondary p-3 lg:p-4">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="min-w-0 text-[15px] font-extrabold sm:text-base">
          Extracted Questions{" "}
          <span className="font-semibold text-muted-foreground">(from question paper)</span>
        </h2>
        {/* Expand All — white pill with shadow, matches Figma */}
        <button
          onClick={toggleAll}
          className="hidden shrink-0 rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-sm hover:bg-card/80 lg:block"
        >
          {allExpanded ? "Collapse All" : "Expand All"}
        </button>
      </div>

      {/* Question cards list */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            selected={selectedId === q.id}
            expanded={Boolean(expanded[q.id])}
            onSelect={() => selectQuestion(q.id)}
            onToggle={() => setExpanded((s) => ({ ...s, [q.id]: !s[q.id] }))}
          />
        ))}
      </div>
    </div>
  );

  const viewer = (
    <AnswerSheetViewer
      selected={selected}
      zoom={zoom}
      onZoom={setZoom}
      page={page}
      onPage={setPage}
      answerSheetPages={answerSheetPages}
    />
  );

  return (
    <div className="flex flex-1 flex-col gap-3">

      {/* ── Grading Summary bar — always visible at the top ── */}
      <GradingSummary questions={questions} />

      {/* ── Mobile: tab toggle (Questions | Answer Sheet) ── */}
      <div className="flex h-[calc(100dvh-15rem)] flex-col gap-3 lg:hidden">
        {/* Tab bar — matches Figma phone design: dark active pill */}
        <div className="grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
          {[
            { key: "questions", label: "Questions" },
            { key: "answers", label: "Answer Sheet" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`h-11 rounded-full text-[15px] font-semibold transition-colors ${
                tab === key
                  ? "bg-ink text-ink-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex min-h-0 flex-1 flex-col">
          {tab === "questions" ? (
            questionList
          ) : (
            <AnswerSheetViewer
              selected={selected}
              zoom={zoom}
              onZoom={setZoom}
              page={page}
              onPage={setPage}
              showTitle={false}
              answerSheetPages={answerSheetPages}
            />
          )}
        </div>
      </div>

      {/* ── Desktop: 40/60 split pane ── */}
      <div className="hidden h-[calc(100dvh-15rem)] gap-4 lg:flex">
        <div className="flex min-h-0 w-[40%] flex-col">{questionList}</div>
        <div className="flex min-h-0 w-[60%] flex-col">{viewer}</div>
      </div>

    </div>
  );
}
