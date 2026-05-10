"use client";

import { Chunk } from "@/lib/types";
import { useState } from "react";
import { useChunks } from "../learn/ChunksContext";

export default function SideTree() {
  const { chunks } = useChunks();

  return (
    <aside className="w-64 border-r h-full overflow-auto p-4 bg-gray-50">
      <h2 className="font-bold mb-4 text-lg">Spis treści</h2>
      <nav>
        {chunks.map((item) => (
          <TreeItem key={item.id} item={item} />
        ))}
      </nav>
    </aside>
  );
}

function TreeItem({ item }: { item: Chunk }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left hover:bg-gray-200 p-1 rounded"
      >
        <span>{isOpen ? "▼" : "▶"}</span>
        <span className="font-medium">{item.title}</span>
      </button>

      {isOpen && item.children.length > 0 && (
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-2">
          {item.children.map((child) => (
            <p
              key={child.id}
              className="hover:bg-gray-200 p-1 rounded cursor-pointer"
            >
              {child.title}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}