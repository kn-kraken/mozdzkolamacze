"use client";

import dynamic from "next/dynamic";

const PdfViewerInner = dynamic(
  () => import("./PdfViewerInner"),
  { ssr: false }
);

export default function PdfViewer({ file }: { file: string }) {
  return <PdfViewerInner file={file} />;
}