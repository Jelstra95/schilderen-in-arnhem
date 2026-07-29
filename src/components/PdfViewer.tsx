"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

// Load the worker from the bundled package (no external CDN).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/**
 * Mobile browsers — iOS Safari in particular — enforce a budget on total canvas
 * bitmap memory and silently drop the backing store of canvases that push past
 * it, which leaves pages blank. So: cap every canvas, and only keep pages near
 * the viewport rasterised.
 */
const MAX_CANVAS_PIXELS = 3_000_000;
const MAX_CANVAS_SIDE = 4096;
/** Rasterise a page once it is within this distance of the viewport — one
 *  screen of lookahead, so scrolling stays ahead of the reader without keeping
 *  a long tail of pages in memory. */
const RENDER_MARGIN = "100% 0px";
/** Retina detail is wasted beyond this; it only costs memory. */
const MAX_PIXEL_RATIO = 2;

const ZOOM_STEPS = [1, 1.5, 2, 3];

type Status = "loading" | "ready" | "error";
/** Page size in PDF units (scale 1), used to reserve layout space up front. */
type PageDims = { width: number; height: number };

/**
 * How many device pixels to render per CSS pixel — the device ratio, pulled
 * down as far as needed to keep the canvas inside the mobile budget.
 */
function backingRatio(cssWidth: number, cssHeight: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  const byArea = Math.sqrt(MAX_CANVAS_PIXELS / (cssWidth * cssHeight));
  const bySide = MAX_CANVAS_SIDE / Math.max(cssWidth, cssHeight);
  return Math.min(dpr, byArea, bySide);
}

/**
 * One page: reserves its slot immediately via `aspect-ratio`, and rasterises
 * only while it is near the viewport. Scrolling away frees the bitmap again.
 */
function PdfPageView({
  doc,
  pageNumber,
  dims,
  cssWidth,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  dims: PageDims;
  cssWidth: number;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { rootMargin: RENDER_MARGIN },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !near || cssWidth <= 0) return;

    let cancelled = false;
    let task: RenderTask | null = null;

    (async () => {
      try {
        const page = await doc.getPage(pageNumber);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: cssWidth / dims.width });
        const ratio = backingRatio(viewport.width, viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = Math.max(1, Math.floor(viewport.width * ratio));
        canvas.height = Math.max(1, Math.floor(viewport.height * ratio));

        task = page.render({
          canvasContext: ctx,
          viewport,
          transform: [ratio, 0, 0, ratio, 0, 0],
        });
        await task.promise;
        if (!cancelled) setRendered(true);
      } catch {
        // Cancelled, or this page failed to draw — the placeholder stays up.
      }
    })();

    return () => {
      cancelled = true;
      task?.cancel();
      // Release the bitmap so the browser's canvas budget stays available for
      // the pages the reader is actually looking at.
      canvas.width = 0;
      canvas.height = 0;
      setRendered(false);
    };
  }, [doc, pageNumber, dims, cssWidth, near]);

  return (
    <div
      ref={wrapperRef}
      className="relative mb-4 overflow-hidden rounded-xl border border-line bg-white shadow-sm"
      style={{ width: cssWidth, aspectRatio: `${dims.width} / ${dims.height}` }}
    >
      {/* Mounted only while near the viewport: an idle <canvas> still costs a
          default-sized backing store, which adds up over a long document. */}
      {near && <canvas ref={canvasRef} className="block h-full w-full" />}
      {!rendered && (
        <span className="absolute inset-0 grid place-items-center text-xs text-muted">
          Pagina {pageNumber}
        </span>
      )}
    </div>
  );
}

/**
 * Remounted on every `src` change and retry, so each load starts from clean
 * state instead of having to reset it inside an effect.
 */
function PdfDocumentView({ src, onRetry }: { src: string; onRetry: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<PageDims[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [availableWidth, setAvailableWidth] = useState(0);
  const [zoom, setZoom] = useState(1);

  // Pages are laid out at the width actually available, so a phone renders a
  // phone-sized bitmap instead of a desktop-sized one.
  const cssWidth = availableWidth * zoom;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setAvailableWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let loaded: PDFDocumentProxy | null = null;

    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`stream ${res.status}`);
        const data = new Uint8Array(await res.arrayBuffer());
        const pdf = await pdfjs.getDocument({ data }).promise;
        loaded = pdf;
        if (cancelled) return;

        // Collect page sizes before drawing anything: every page can then hold
        // its own slot, so the document has its full height from the start and
        // scrolling never jumps as pages fill in.
        const dims: PageDims[] = [];
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const { width, height } = page.getViewport({ scale: 1 });
          dims.push({ width, height });
        }
        if (cancelled) return;

        setPages(dims);
        setDoc(pdf);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      loaded?.destroy();
    };
  }, [src]);

  // Keep the reader roughly in place across a zoom change: remember how far
  // into the document they were, in multiples of the page width.
  const anchorRef = useRef<number | null>(null);

  const changeZoom = useCallback(
    (next: number) => {
      const root = rootRef.current;
      if (root && cssWidth > 0) {
        const top = root.getBoundingClientRect().top + window.scrollY;
        anchorRef.current = (window.scrollY - top) / cssWidth;
      }
      setZoom(next);
    },
    [cssWidth],
  );

  useLayoutEffect(() => {
    const offset = anchorRef.current;
    const root = rootRef.current;
    if (offset === null || !root || cssWidth <= 0) return;
    anchorRef.current = null;
    const top = root.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + offset * cssWidth });
  }, [cssWidth]);

  const zoomIndex = ZOOM_STEPS.indexOf(zoom);

  return (
    <div
      ref={rootRef}
      className="select-none [-webkit-touch-callout:none]"
      onContextMenu={(e) => e.preventDefault()}
    >
      {status === "loading" && (
        <p className="py-16 text-center text-muted">Materiaal laden…</p>
      )}

      {status === "error" && (
        <div className="py-16 text-center">
          <p className="text-red-700">Het materiaal kon niet worden geladen.</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-md border border-line bg-paper px-3 py-1.5 text-sm text-ink hover:border-clay hover:text-clay"
          >
            Opnieuw proberen
          </button>
        </div>
      )}

      {status === "ready" && doc && (
        <>
          <div className="sticky top-16 z-10 -mx-1 mb-4 flex items-center justify-between gap-3 rounded-md border border-line bg-paper/90 px-3 py-2 backdrop-blur-md">
            <span className="text-xs text-muted">
              {pages.length} pagina{pages.length === 1 ? "" : "'s"}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Uitzoomen"
                disabled={zoomIndex <= 0}
                onClick={() => changeZoom(ZOOM_STEPS[zoomIndex - 1])}
                className="h-9 w-9 rounded-md border border-line text-lg leading-none text-ink disabled:opacity-40"
              >
                −
              </button>
              <span className="w-12 text-center text-xs tabular-nums text-muted">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                aria-label="Inzoomen"
                disabled={zoomIndex >= ZOOM_STEPS.length - 1}
                onClick={() => changeZoom(ZOOM_STEPS[zoomIndex + 1])}
                className="h-9 w-9 rounded-md border border-line text-lg leading-none text-ink disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          {/* Zoomed pages are wider than the column, so they pan sideways here
              instead of stretching the page and breaking the layout. */}
          <div className="overflow-x-auto">
            <div className="mx-auto" style={{ width: cssWidth }}>
              {pages.map((dims, i) => (
                <PdfPageView
                  key={i}
                  doc={doc}
                  pageNumber={i + 1}
                  dims={dims}
                  cssWidth={cssWidth}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function PdfViewer({ src }: { src: string }) {
  const [attempt, setAttempt] = useState(0);
  return (
    <PdfDocumentView
      key={`${src}#${attempt}`}
      src={src}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );
}
