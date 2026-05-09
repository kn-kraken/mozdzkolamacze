// app/components/Sidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

const MOCK_DATA = [
  {
    title: 'Podstawy Reacta',
    children: [
      { title: 'Komponenty', href: '/learn/components' },
      { title: 'Propsy', href: '/learn/props' },
    ],
  },
  {
    title: 'Zaawansowane',
    children: [
      { title: 'Hooks', href: '/learn/hooks' },
      { title: 'Context API', href: '/learn/context' },
    ],
  },
];

export default function SideTree() {
  return (
    <aside className="w-64 border-r h-screen p-4 bg-gray-50">
      <h2 className="font-bold mb-4 text-lg">Spis treści</h2>
      <nav>
        {MOCK_DATA.map((item, idx) => (
          <TreeItem key={idx} item={item} />
        ))}
      </nav>
    </aside>
  );
}

function TreeItem({ item }: { item: any }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full text-left hover:bg-gray-200 p-1 rounded"
      >
        <span>{isOpen ? '▼' : '▶'}</span>
        <span className="font-medium">{item.title}</span>
      </button>
      
      {isOpen && item.children && (
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-2">
          {item.children.map((child: any, idx: number) => (
            <Link 
              key={idx} 
              href={child.href}
              className="text-sm text-blue-600 hover:underline py-1"
            >
              {child.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}