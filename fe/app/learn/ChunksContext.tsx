"use client";

import { Chunk } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";

type ChunksContextType = {
  chunks: Chunk[];
  setChunks: (chunks: Chunk[]) => void;
};

const ChunksContext = createContext<ChunksContextType>({
  chunks: [],
  setChunks: () => {},
});

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1];
}

export function ChunksProvider({ children }: { children: React.ReactNode }) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <ChunksContext.Provider value={{ chunks, setChunks }}>
      {children}
    </ChunksContext.Provider>
  );
}

export function useChunks() {
  return useContext(ChunksContext);
}
