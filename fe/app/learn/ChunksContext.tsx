"use client";

import { Chunk } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ChunksContextType = {
  chunks: Chunk[];
  setChunks: (chunks: Chunk[]) => void;
  currentChunkId: string | null;
  nextChunkId: string | null;
};

const ChunksContext = createContext<ChunksContextType>({
  chunks: [],
  setChunks: () => {},
  currentChunkId: null,
  nextChunkId: null,
});

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1];
}

function flattenLeafIds(items: Chunk[]): string[] {
  const result: string[] = [];
  for (const item of items) {
    if (item.children.length === 0) {
      result.push(item.id);
    } else {
      result.push(...flattenLeafIds(item.children));
    }
  }
  return result;
}

export function ChunksProvider({ children }: { children: React.ReactNode }) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams<{ chunkId?: string }>();

  useEffect(() => {
    async function init() {
      if (!getCookie("sessionId")) {
        await fetch("http://localhost:8000/session", {
          method: "POST",
          credentials: "include",
        });
      }
      const res = await fetch("http://localhost:8000/chunks", {
        credentials: "include",
      });
      const data: Chunk[] = await res.json();
      console.log(data);
      setChunks(data);
      setLoading(false);
    }
    init();
  }, []);

  const nextChunkId = useMemo(() => {
    const currentId = params?.chunkId;
    if (!currentId || chunks.length === 0) return null;
    const flat = flattenLeafIds(chunks);
    const idx = flat.indexOf(currentId);
    return idx !== -1 && idx < flat.length - 1 ? flat[idx + 1] : null;
  }, [chunks, params?.chunkId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <ChunksContext.Provider value={{ chunks, setChunks, currentChunkId: params?.chunkId ?? null, nextChunkId }}>
      {children}
    </ChunksContext.Provider>
  );
}

export function useChunks() {
  return useContext(ChunksContext);
}
