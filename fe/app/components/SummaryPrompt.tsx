"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const router = useRouter();
  const { currentChunkId, nextChunkId } = useChunks();

  const handleSubmit = async () => {
    const res = await fetch(
      `http://localhost:8000/chunk/${currentChunkId}/summary-evaluation`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: answer }),
      },
    );
    if (res.ok && nextChunkId) {
      router.push(`/learn/${nextChunkId}`);
    } else {
      const data = await res.json();
      setAnswer("");
      setHint(data.detail?.hint ?? "Summary not accurate. Please try again.");
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
      <div className="max-w-3xl w-full px-8 py-6 bg-white backdrop-blur-sm rounded-xl shadow-md">
        <label className="block text-lg font-semibold mb-2">
          Now summarize the excerpt in one sentence
        </label>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
          rows={4}
          placeholder="Type your summary here..."
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setHint(null);
          }}
        />
        <div className="mt-2 text-sm text-red-600">
          <label className="block text-lg font-semibold mb-2 color-red-500">
            {hint ?? ""}
          </label>
        </div>
        <div className="flex justify-between w-full">
          <button
            onClick={exit}
            className="mt-3 px-6 py-2 bg-red-500 text-white font-semibold rounded-lg cursor-pointer transition-colors duration-200 hover:bg-red-600 active:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Exit
          </button>

          <button
            suppressHydrationWarning
            disabled={!answer.trim()}
            onClick={handleSubmit}
            className="mt-3 px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-600 active:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
