"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";

// Load the worker from the bundled package (no external CDN).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type Status = "loading" | "ready" | "error";

/**
 * Renders a PDF (served by `src`) into a canvas thumbnail for the admin
 * material gallery cards. Prefers the second page — the first slide is usually
 * the generic course announcement, while the second carries the topic image —
 * and falls back to the first page for single-page documents.
 */
export function PdfThumb({ src }: { src: string }) {
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
        // Second slide when available; first for single-page documents.
        const pageNumber = pdf.numPages >= 2 ? 2 : 1;
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const viewport = page.getViewport({ scale: 1 });
        // Fit to a ~300px-wide thumbnail, capped by device pixel ratio.
        const scale = (300 / viewport.width) * (window.devicePixelRatio || 1);
        const scaled = page.getViewport({ scale });
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = scaled.width;
        canvas.height = scaled.height;
        await page.render({ canvasContext: ctx, viewport: scaled }).promise;
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
  }, [src]);

  return (
    <div className="flex h-full w-full items-center justify-center bg-mist/40">
      {status === "loading" && (
        <span className="text-xs text-muted">Laden…</span>
      )}
      {status === "error" && (
        <span className="text-xs text-muted">PDF</span>
      )}
      <canvas
        ref={canvasRef}
        className={
          status === "ready"
            ? "h-full w-full object-cover object-top"
            : "hidden"
        }
      />
    </div>
  );
}
