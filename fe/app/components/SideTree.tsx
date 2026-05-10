"use client";

import { Chunk } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  highlighted,
}: {
  item: Chunk;
  currentChunkId: string | null;
  highlighted?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const { onlyLeaf } = useChunks();
  const router = useRouter();
  const children = item.children ?? [];
  const isLeaf = children.length === 0;
  const isActive = item.id === currentChunkId;
  const isHighlighted = highlighted || (!onlyLeaf && isActive);

  if (isLeaf) {
    return (
      <Link
        href={`/learn/${item.id}`}
        className={`block hover:bg-gray-200 p-1 rounded cursor-pointer ${
          isActive ? "bg-gray-200 font-semibold" : isHighlighted ? "bg-gray-100 font-semibold" : ""
        }`}
      >
        {item.title}
      </Link>
    );
  }

  return (
    <div className="mb-2">
      <div
        className={`flex items-center gap-1 p-1 rounded ${isActive ? "bg-gray-200" : isHighlighted ? "bg-gray-100" : ""}`}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hover:bg-gray-300 rounded px-1"
        >
          {isOpen ? "▼" : "▶"}
        </button>
        <Link
          href={`/learn/${item.id}${isActive ? (onlyLeaf ? "?onlyLeaf=false" : "") : ""}`}
          onClick={(e) => {
            if (isActive) {
              e.preventDefault();
              router.push(`/learn/${item.id}${onlyLeaf ? "?onlyLeaf=false" : ""}`);
            }
          }}
          className={`font-medium hover:bg-gray-200 rounded px-1 flex-1 ${isActive || isHighlighted ? "font-semibold" : ""}`}
        >
          {item.title}
        </Link>
      </div>

      {isOpen && (
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-2">
          {children.map((child) => (
            <TreeItem
              key={child.id}
              item={child}
              currentChunkId={currentChunkId}
              highlighted={isHighlighted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
