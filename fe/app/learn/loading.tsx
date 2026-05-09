import { Loader2 } from "lucide-react";

export default function LearnLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
    </div>
  );
}
