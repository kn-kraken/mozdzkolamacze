// app/learn/layout.tsx
import SideTree from '../components/SideTree';

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      {/* Sidebar po lewej stronie */}
      <SideTree/>
      
      {/* Główna treść strony (page.tsx) */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}