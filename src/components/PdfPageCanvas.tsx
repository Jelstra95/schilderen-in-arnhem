"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import { cn } from "@/lib/cn";

// Load the worker from the bundled package (no external CDN).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type Status = "loading" | "ready" | "error";

/**
 * Renders a single page of a PDF (served by `src`) into a canvas that fills its
 * container. `page` is clamped to the document's page count, so asking for page
 * 2 of a one-page PDF falls back to page 1.
 */
export function PdfPageCanvas({
  src,
  page = 1,
  className,
}: {
  src: string;
  page?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return;

        const pageNum = Math.min(Math.max(page, 1), pdf.numPages);
        const p = await pdf.getPage(pageNum);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const base = p.getViewport({ scale: 1 });
        // Render at ~600px wide, honouring device pixel ratio for crispness.
        const scale = (600 / base.width) * (window.devicePixelRatio || 1);
        const viewport = p.getViewport({ scale });
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await p.render({ canvasContext: ctx, viewport }).promise;
        if (cancelled) return;
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [src, page]);

  return (
    <>
      {status !== "ready" && <div className="absolute inset-0 bg-mist" />}
      <canvas
        ref={canvasRef}
        className={cn(className, status === "ready" ? "" : "opacity-0")}
      />
    </>
  );
}
