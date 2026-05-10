"use client";

import { Chunk } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import { Loader2 } from "lucide-react";
import { use, useCallback, useEffect, useRef, useState } from "react";

import Markdown from "react-markdown";
import SummaryPrompt from "../../components/SummaryPrompt";
import { useChunks } from "../ChunksContext";

function findChunk(chunks: Chunk[], id: string): Chunk | null {
  for (const c of chunks) {
    if (c.id === id) return c;
    const found = findChunk(c.children ?? [], id);
    if (found) return found;
  }
  return null;
}

function DescendantList({ chunk }: { chunk: Chunk }) {
  const children = chunk.children ?? [];
  if (children.length === 0) {
    return <li className="py-0.5">{chunk.title}</li>;
  }
  return (
    <li className="py-0.5">
      <span className="font-medium">{chunk.title}</span>
      <ul className="ml-4 border-l pl-3 mt-1">
        {children.map((child) => (
          <DescendantList key={child.id} chunk={child} />
        ))}
      </ul>
    </li>
  );
}

export default function LearnPage({
  params,
}: {
  params: Promise<{ chunkId: string }>;
}) {
  const { chunkId } = use(params);
  const { chunks, onlyLeaf } = useChunks();
  const [content, setContent] = useState<string | null>(null);
  const [reachedBottom, setReachedBottom] = useState(false);
  const [blurred, setBlurred] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContent(null);
    setReachedBottom(false);
    setBlurred(false);
    fetch(`http://localhost:8000/chunk/${chunkId}`, {
      credentials: "include",
    })
      .then((res) => res.text())
      .then(setContent);
  }, [chunkId]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || reachedBottom) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setReachedBottom(true);
    }
  }, [reachedBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !content || reachedBottom) return;
    if (el.scrollHeight <= el.clientHeight) {
      setReachedBottom(true);
    }
  }, [content, reachedBottom]);

  if (!onlyLeaf) {
    const chunk = findChunk(chunks, chunkId);
    return (
      <div className="relative h-full overflow-auto">
        <div
          className={`max-w-3xl mx-auto p-8 transition-all duration-300 ${blurred ? "blur-sm" : ""}`}
        >
          <h1 className="text-2xl font-bold mb-6">
            Summarize the whole section
          </h1>
          {chunk && (
            <ul className="text-gray-700">
              <DescendantList chunk={chunk} />
            </ul>
          )}
        </div>
        <SummaryPrompt visible={blurred} exit={() => setBlurred(false)} />
        <button
          onClick={() => setBlurred(!blurred)}
          className={`group fixed right-0 top-0 flex items-center justify-center w-20 h-full cursor-pointer transition-all duration-300 bg-gray-100/30 hover:bg-gray-200 hover:w-24 ${
            !blurred
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-10 pointer-events-none"
          }`}
        >
          <ChevronRight className="text-gray-400 transition-all duration-200 group-hover:text-gray-700 group-hover:translate-x-0.5 group-active:translate-x-1" />
        </button>
      </div>
    );
  }

  if (content === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="relative h-full overflow-auto"
      ref={scrollRef}
      onScroll={handleScroll}
    >
      <article
        className={`prose max-w-3xl mx-auto p-8 mb-6 transition-all duration-300 ${blurred ? "blur-sm" : ""}`}
      >
        <Markdown urlTransform={(url) => url}>{content}</Markdown>
      </article>
      <SummaryPrompt visible={blurred} exit={() => setBlurred(false)} />
      <button
        onClick={() => setBlurred(!blurred)}
        className={`group fixed right-0 top-0 flex items-center justify-center w-20 h-full cursor-pointer transition-all duration-300 bg-gray-100/30 hover:bg-gray-200 hover:w-24 ${
          reachedBottom && !blurred
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-10 pointer-events-none"
        }`}
      >
        <ChevronRight className="text-gray-400 transition-all duration-200 group-hover:text-gray-700 group-hover:translate-x-0.5 group-active:translate-x-1" />
      </button>
    </div>
  );
}
