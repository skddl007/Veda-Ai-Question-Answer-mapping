import { useState } from "react";
import { AppShell } from "./components/AppShell.jsx";
import { UploadScreen } from "./components/UploadScreen.jsx";
import { LoadingScreen } from "./components/LoadingScreen.jsx";
import { MappingScreen } from "./components/MappingScreen.jsx";

export default function App() {
  // "upload" -> "loading" -> "mapping"
  const [stage, setStage] = useState("upload");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleProcess = async ({ question, answer }) => {
    if (!question || !answer) return;
    setStage("loading");
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("question_paper", question);
      formData.append("answer_sheet", answer);

      const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${API_BASE}/api/process`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to process documents");
      }

      const data = await res.json();
      setResults(data);
      setStage("mapping");
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStage("upload");
    }
  };

  return (
    <AppShell
      collapsed={stage !== "upload"}
      onBack={stage === "mapping" ? () => setStage("upload") : undefined}
    >
      {stage === "upload" && (
        <div className="flex flex-col flex-1 w-full max-w-6xl mx-auto gap-4">
          {error && (
            <div className="rounded-2xl bg-red-100 p-4 text-center text-red-600 font-bold mx-4 sm:mx-8">
              Something went wrong analyzing the documents. Please try again.
            </div>
          )}
          <UploadScreen onStart={handleProcess} />
        </div>
      )}
      {stage === "loading" && <LoadingScreen />}
      {stage === "mapping" && <MappingScreen results={results} />}
    </AppShell>
  );
}
