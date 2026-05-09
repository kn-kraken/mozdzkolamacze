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
        <Image src={navMid} alt="" className="h-full w-auto" />
        <Image src={navRight} alt="" className="h-full w-auto" />
      </nav>
      <main className="flex-1 bg-white overflow-hidden">
        <PdfViewer file="/file.pdf" />
      </main>
    </div>
  );
}
