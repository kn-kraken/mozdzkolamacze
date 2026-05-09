// app/learn/layout.tsx
import SideTree from '../components/SideTree';

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <SideTree/>
      <div className="flex-1 min-h-0 min-w-0">
        {children}
      </div>
    </div>
  );
}