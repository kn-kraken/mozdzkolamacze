import { Suspense } from "react";
import SideTree from "../components/SideTree";
import { ChunksProvider } from "./ChunksContext";

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <ChunksProvider>
        <div className="flex h-full">
          <SideTree />
          <div className="flex-1 min-h-0 min-w-0">{children}</div>
        </div>
      </ChunksProvider>
    </Suspense>
  );
}