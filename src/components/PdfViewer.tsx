"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";

// Load the worker from the bundled package (no external CDN).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type Status = "loading" | "ready" | "error";

export function PdfViewer({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;

    async function render() {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return;
        if (container) container.innerHTML = "";

        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          if (cancelled) return;
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          const dpr = window.devicePixelRatio || 1;
          canvas.width = viewport.width * dpr;
          canvas.height = viewport.height * dpr;
          canvas.style.width = "100%";
          canvas.style.maxWidth = `${viewport.width}px`;
          canvas.className =
            "mx-auto mb-4 rounded-lg border border-line shadow-sm";
          ctx.scale(dpr, dpr);
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;
          container?.appendChild(canvas);
        }
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
    <div
      className="select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {status === "loading" && (
        <p className="py-16 text-center text-muted">Materiaal laden…</p>
      )}
      {status === "error" && (
        <p className="py-16 text-center text-red-700">
          Het materiaal kon niet worden geladen.
        </p>
      )}
      <div ref={containerRef} />
    </div>
  );
}
