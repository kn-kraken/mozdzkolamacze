import { BookOpen } from "lucide-react";
import Image from "next/image";
import navLeft from "@/public/nav-left.png";
import navMid from "@/public/nav-mid.png";
import navRight from "@/public/nav-right.png";
import PdfViewer from "./components/PdfViewer";

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <nav className="flex flex-row h-20 justify-between w-screen shadow-sm">
        <Image src={navLeft} alt="" className="h-full w-auto" />
        <div className="flex">
          <Image src={navMid} alt="" className="h-full w-auto" />
          <button className="flex flex-col content-center w-28 p-2 pt-3 cursor-pointer rounded-lg transition-all duration-200 hover:bg-gray-100 hover:scale-105 active:scale-95">
            <BookOpen className="flex-1 w-full p-1 transition-transform duration-200 group-hover:rotate-3" />
            <label className="cursor-pointer">Learn</label>
          </button>
        </div>
        <Image src={navRight} alt="" className="h-full w-auto" />
      </nav>
      <main className="flex-1 bg-white overflow-hidden">
        <PdfViewer file="/file.pdf" />
      </main>
    </div>
  );
}
