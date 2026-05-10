"use client";

import { Chunk } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ChunksContextType = {
  chunks: Chunk[];
  setChunks: (chunks: Chunk[]) => void;
  currentChunkId: string | null;
  nextChunkId: string | null;
  isNextOnlyLeaf: boolean;
  onlyLeaf: boolean;
};

const ChunksContext = createContext<ChunksContextType>({
  chunks: [],
  setChunks: () => {},
  currentChunkId: null,
  nextChunkId: null,
  isNextOnlyLeaf: false,
  onlyLeaf: true,
});

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1];
}

function flattenLeafIds(items: Chunk[]): string[] {
  const result: string[] = [];
  for (const item of items) {
    if (!item.children || item.children.length === 0) {
      result.push(item.id);
    } else {
      result.push(...flattenLeafIds(item.children));
    }
  }
  return result;
}

function findChunk(items: Chunk[], targetId: string): Chunk | null {
  for (const item of items) {
    if (item.id === targetId) return item;
    const found = findChunk(item.children ?? [], targetId);
    if (found) return found;
  }
  return null;
}

function firstLeafId(chunk: Chunk): string {
  const children = chunk.children ?? [];
  if (children.length === 0) return chunk.id;
  return firstLeafId(children[0]);
}

function findParent(items: Chunk[], targetId: string): Chunk | null {
  for (const item of items) {
    const children = item.children ?? [];
    for (const child of children) {
      if (child.id === targetId) return item;
    }
    const found = findParent(children, targetId);
    if (found) return found;
  }
  return null;
}

export function ChunksProvider({ children }: { children: React.ReactNode }) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams<{ chunkId?: string }>();
  const searchParams = useSearchParams();
  const onlyLeaf = searchParams.get("onlyLeaf") !== "false";

  useEffect(() => {
    async function init() {
      if (!getCookie("sessionId")) {
        await fetch("http://localhost:8000/session", {
          method: "POST",
          credentials: "include",
        });
      }
      let res = await fetch("http://localhost:8000/chunks", {
        credentials: "include",
      });
      if (res.status === 401) {
        await fetch("http://localhost:8000/session", {
          method: "POST",
          credentials: "include",
        });
        res = await fetch("http://localhost:8000/chunks", {
          credentials: "include",
        });
      }
      const data: Chunk[] = await res.json();
      console.log(data);
      setChunks(data);
      setLoading(false);
    }
    init();
  }, []);

  const { nextChunkId, isNextOnlyLeaf } = useMemo(() => {
    const currentId = params?.chunkId;
    if (!currentId || chunks.length === 0)
      return { nextChunkId: null, isNextOnlyLeaf: false };

    const parent = findParent(chunks, currentId);
    const siblings = parent?.children ?? chunks;
    const siblingIdx = siblings.findIndex((s) => s.id === currentId);

    if (!onlyLeaf) {
      // In section summary mode, next is the next sibling
      if (siblingIdx !== -1 && siblingIdx < siblings.length - 1) {
        return { nextChunkId: siblings[siblingIdx + 1].id, isNextOnlyLeaf: false };
      }
      return { nextChunkId: null, isNextOnlyLeaf: false };
    }

    // If current node is a parent, next should be its first leaf child
    const currentChunk = findChunk(chunks, currentId);
    if (currentChunk && currentChunk.children && currentChunk.children.length > 0) {
      return { nextChunkId: firstLeafId(currentChunk), isNextOnlyLeaf: false };
    }

    const isLastChild = siblingIdx === siblings.length - 1 && siblings.length > 0;

    if (isLastChild && parent) {
      return { nextChunkId: parent.id, isNextOnlyLeaf: true };
    }

    const flat = flattenLeafIds(chunks);
    const idx = flat.indexOf(currentId);
    const next = idx !== -1 && idx < flat.length - 1 ? flat[idx + 1] : null;
    return { nextChunkId: next, isNextOnlyLeaf: false };
  }, [chunks, params?.chunkId, onlyLeaf]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <ChunksContext.Provider
      value={{
        chunks,
        setChunks,
        currentChunkId: params?.chunkId ?? null,
        nextChunkId,
        isNextOnlyLeaf,
        onlyLeaf,
      }}
    >
      {children}
    </ChunksContext.Provider>
  );
}

export function useChunks() {
  return useContext(ChunksContext);
}
