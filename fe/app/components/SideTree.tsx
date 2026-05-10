"use client";

import { Chunk } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";
import { useChunks } from "../learn/ChunksContext";

export default function SideTree() {
  const { chunks, currentChunkId } = useChunks();

  return (
    <aside className="w-64 border-r h-full overflow-auto p-4 bg-gray-50">
      <h2 className="font-bold mb-4 text-lg">Table of concepts</h2>
      <nav>
        {chunks.map((item) => (
          <TreeItem key={item.id} item={item} currentChunkId={currentChunkId} />
        ))}
      </nav>
    </aside>
  );
}

function TreeItem({
  item,
  currentChunkId,
}: {
  item: Chunk;
  currentChunkId: string | null;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const children = item.children ?? [];
  const isLeaf = children.length === 0;
  const isActive = isLeaf && item.id === currentChunkId;

  if (isLeaf) {
    return (
      <Link
        href={`/learn/${item.id}`}
        className={`block hover:bg-gray-200 p-1 rounded cursor-pointer ${
          isActive ? "bg-gray-200 font-semibold" : ""
        }`}
      >
        {item.title}
      </Link>
    );
  }

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left hover:bg-gray-200 p-1 rounded"
      >
        <span>{isOpen ? "▼" : "▶"}</span>
        <span className="font-medium">{item.title}</span>
      </button>

      {isOpen && (
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-2">
          {children.map((child) => (
            <TreeItem
              key={child.id}
              item={child}
              currentChunkId={currentChunkId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
