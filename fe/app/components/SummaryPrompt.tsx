"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useChunks } from "../learn/ChunksContext";

export default function SummaryPrompt({
  visible,
  exit,
}: {
  visible: boolean;
  exit: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const router = useRouter();
  const { currentChunkId, nextChunkId, isNextOnlyLeaf } = useChunks();

  useEffect(() => {
    setHasEvaluated(false);
    setAnswer("");
    setHint(null);
  }, [currentChunkId]);

  const goToNext = () => {
    if (nextChunkId) {
      router.push(`/learn/${nextChunkId}${isNextOnlyLeaf ? "?onlyLeaf=false" : ""}`);
    } else {
      router.push("/learn");
    }
  };

  const handleSubmit = async () => {
    if (answer.trim() === "next") {
      goToNext();
      return;
    }

    setLoading(true);
    setHint(null);
    try {
      const res = await fetch(
        `http://localhost:8000/chunk/${currentChunkId}/summary-evaluation`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary: answer }),
        },
      );
      if (res.ok) {
        goToNext();
        setAnswer("");
      } else {
        const data = await res.json();
        setHint(data.detail?.tip ?? "Summary not accurate. Please try again.");
      }
    } catch (err) {
      setHint("Failed to submit summary. Please check your connection.");
    } finally {
      setLoading(false);
      setHasEvaluated(true);
    }
  };

  return (
    <div
      className={`fixed inset-0 top-20 flex items-center justify-center transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="max-w-3xl w-full px-8 py-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-100">
        <label className="block text-lg font-semibold mb-2">
          Now summarize the section in one sentence
        </label>
        <textarea
          disabled={loading}
          className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
          rows={4}
          placeholder="Type your summary here..."
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setHint(null);
          }}
        />

        {loading && (
          <div className="mt-4 flex items-center gap-3 text-blue-600 animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Evaluating your summary with AI...</span>
          </div>
        )}

        {hint && !loading && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Improvement Tip:</p>
                <p className="text-sm text-red-700 mt-1 leading-relaxed">{hint}</p>
              </div>
            </div>
          </div>
        )}

        <div className={`flex ${hasEvaluated ? "justify-between" : "justify-end"} w-full mt-6`}>
          {hasEvaluated && (
            <button
              disabled={loading}
              onClick={exit}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50"
            >
              Exit
            </button>
          )}

          <button
            disabled={!answer.trim() || loading}
            onClick={handleSubmit}
            className={`px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md ${!hasEvaluated ? "w-full" : ""}`}
          >
            Submit Summary
          </button>
        </div>
      </div>
    </div>
  );
}
