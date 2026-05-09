"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Fix: Use the CDN version that matches your installed package version.
// This replaces the "new URL(...)" block that was failing in Turbopack.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewerInner({ file }: { file: string }) {
  const [numPages, setNumPages] = useState<number>();

  return (
    <div className="overflow-auto h-full flex flex-col items-center bg-white">
      <Document
        file={file}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      >
        {numPages &&
          Array.from({ length: numPages }, (_, i) => (
            <Page key={i + 1} pageNumber={i + 1} scale={1.5} />
          ))}
      </Document>
    </div>
  );
}