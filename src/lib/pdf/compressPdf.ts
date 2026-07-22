// Client-side PDF compressor. Rasterises each page with pdf.js and re-encodes
// it as a JPEG, then reassembles a new PDF (see buildImagePdf). This reliably
// shrinks image-heavy, hand-made PDFs at the cost of selectable text. It runs
// entirely in the browser, so a >100 MB file never has to travel to the server.

import { buildImagePdf, type JpegPage } from "./buildImagePdf";

interface Attempt {
  dpi: number;
  quality: number;
}

// Tried in order; we stop at the first result that fits under the target.
const ATTEMPTS: Attempt[] = [
  { dpi: 150, quality: 0.72 },
  { dpi: 132, quality: 0.62 },
  { dpi: 110, quality: 0.55 },
  { dpi: 96, quality: 0.5 },
  { dpi: 80, quality: 0.45 },
];

export interface CompressProgress {
  attempt: number;
  totalAttempts: number;
  page: number;
  totalPages: number;
}

export interface CompressResult {
  file: File;
  originalBytes: number;
  compressedBytes: number;
  pages: number;
}

export async function compressPdf(
  file: File,
  opts: { maxBytes: number; onProgress?: (p: CompressProgress) => void },
): Promise<CompressResult> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const original = new Uint8Array(await file.arrayBuffer());

  let best: Uint8Array | null = null;
  let pageCount = 0;

  for (let a = 0; a < ATTEMPTS.length; a++) {
    const { bytes, pages } = await rasterize(
      pdfjs,
      original,
      ATTEMPTS[a],
      (page, totalPages) =>
        opts.onProgress?.({
          attempt: a + 1,
          totalAttempts: ATTEMPTS.length,
          page,
          totalPages,
        }),
    );
    best = bytes;
    pageCount = pages;
    if (bytes.length <= opts.maxBytes) break;
  }

  const out = best!;
  const name = file.name.replace(/\.pdf$/i, "") + ".pdf";
  // Copy into a plain ArrayBuffer so it's an unambiguous BlobPart.
  const ab = new ArrayBuffer(out.length);
  new Uint8Array(ab).set(out);
  return {
    file: new File([ab], name, { type: "application/pdf" }),
    originalBytes: file.size,
    compressedBytes: out.length,
    pages: pageCount,
  };
}

type PdfjsModule = typeof import("pdfjs-dist");

async function rasterize(
  pdfjs: PdfjsModule,
  data: Uint8Array,
  cfg: Attempt,
  onPage: (page: number, totalPages: number) => void,
): Promise<{ bytes: Uint8Array; pages: number }> {
  // getDocument may transfer/detach the buffer, so hand it a fresh copy.
  const loadingTask = pdfjs.getDocument({ data: data.slice() });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  if (totalPages === 0) throw new Error("PDF heeft geen pagina's");

  const scale = cfg.dpi / 72; // PDF points are 1/72"
  const pages: JpegPage[] = [];

  try {
    for (let n = 1; n <= totalPages; n++) {
      const page = await pdf.getPage(n);
      const viewportPt = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Geen canvas-context beschikbaar");

      // JPEG has no alpha — paint white behind transparent pages.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;

      const jpeg = await canvasToJpeg(canvas, cfg.quality);
      pages.push({
        jpeg,
        widthPx: canvas.width,
        heightPx: canvas.height,
        pageWidthPt: viewportPt.width,
        pageHeightPt: viewportPt.height,
      });

      page.cleanup();
      canvas.width = 0;
      canvas.height = 0;
      onPage(n, totalPages);
    }
  } finally {
    await pdf.destroy();
  }

  return { bytes: buildImagePdf(pages), pages: totalPages };
}

function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Kon pagina niet omzetten naar afbeelding"));
          return;
        }
        blob
          .arrayBuffer()
          .then((b) => resolve(new Uint8Array(b)))
          .catch(reject);
      },
      "image/jpeg",
      quality,
    );
  });
}
