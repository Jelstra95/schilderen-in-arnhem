import * as pdfjs from "pdfjs-dist";

// Load the worker from the bundled package (no external CDN). Client-only.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/**
 * Renders one page of a PDF File to a compact JPEG data string (base64, no data
 * URL prefix) for use as a fast-loading thumbnail. `page` is clamped to the
 * document's page count, so page 2 of a one-page PDF falls back to page 1.
 * Returns null on any failure (thumbnail generation is best-effort).
 */
export async function renderPdfPageToJpegBase64(
  file: File,
  page = 1,
  maxWidth = 640,
): Promise<string | null> {
  try {
    const data = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data }).promise;
    const pageNum = Math.min(Math.max(page, 1), pdf.numPages);
    const p = await pdf.getPage(pageNum);

    const base = p.getViewport({ scale: 1 });
    const scale = Math.min(maxWidth / base.width, 2);
    const viewport = p.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    await p.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.72),
    );
    if (!blob) return null;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return dataUrl.slice(dataUrl.indexOf(",") + 1); // strip "data:...;base64,"
  } catch {
    return null;
  }
}
