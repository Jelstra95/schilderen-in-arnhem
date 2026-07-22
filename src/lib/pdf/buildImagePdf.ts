/**
 * Minimal, dependency-free PDF writer that packs one JPEG per page.
 *
 * Each JPEG is embedded verbatim as an image XObject using the standard
 * `/DCTDecode` filter (PDF's native support for JPEG streams), so no image
 * re-encoding happens here. This is the assembly half of the client-side PDF
 * compressor: pdf.js rasterises each page to a JPEG, and this turns those
 * JPEGs back into a valid PDF.
 *
 * Pure (no browser or Node APIs beyond TextEncoder), which keeps it unit
 * testable outside a browser.
 */

export interface JpegPage {
  /** Raw JPEG bytes (as produced by `canvas.toBlob('image/jpeg')`). */
  jpeg: Uint8Array;
  /** Pixel dimensions of the JPEG. */
  widthPx: number;
  heightPx: number;
  /** Page size in PDF points (1/72"), i.e. the original page dimensions. */
  pageWidthPt: number;
  pageHeightPt: number;
}

export function buildImagePdf(pages: JpegPage[]): Uint8Array {
  if (pages.length === 0) throw new Error("buildImagePdf: no pages");

  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let length = 0;
  const offsets: number[] = []; // offsets[objNum] = byte offset

  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    length += b.length;
  };
  const pushStr = (s: string) => pushBytes(enc.encode(s));
  const startObject = (n: number) => {
    offsets[n] = length;
    pushStr(`${n} 0 obj\n`);
  };

  // Object numbering:
  //   1 = Catalog, 2 = Pages, then per page k (0-based):
  //   pageObj = 3 + 3k, contentObj = 4 + 3k, imageObj = 5 + 3k
  const pageObjNum = (k: number) => 3 + k * 3;
  const contentObjNum = (k: number) => 4 + k * 3;
  const imageObjNum = (k: number) => 5 + k * 3;
  const totalObjects = 2 + pages.length * 3;

  // Header — the binary comment marks the file as containing binary data.
  pushStr("%PDF-1.7\n");
  pushBytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  // 1: Catalog
  startObject(1);
  pushStr("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // 2: Pages tree
  const kids = pages.map((_, k) => `${pageObjNum(k)} 0 R`).join(" ");
  startObject(2);
  pushStr(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>\nendobj\n`);

  // Per-page objects
  pages.forEach((p, k) => {
    const w = round(p.pageWidthPt);
    const h = round(p.pageHeightPt);

    // Page
    startObject(pageObjNum(k));
    pushStr(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] ` +
        `/Resources << /XObject << /Im0 ${imageObjNum(k)} 0 R >> >> ` +
        `/Contents ${contentObjNum(k)} 0 R >>\nendobj\n`,
    );

    // Content stream: draw the image to fill the whole page.
    const content = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q\n`;
    const contentBytes = enc.encode(content);
    startObject(contentObjNum(k));
    pushStr(`<< /Length ${contentBytes.length} >>\nstream\n`);
    pushBytes(contentBytes);
    pushStr("endstream\nendobj\n");

    // Image XObject: the JPEG embedded via DCTDecode.
    startObject(imageObjNum(k));
    pushStr(
      `<< /Type /XObject /Subtype /Image /Width ${p.widthPx} ` +
        `/Height ${p.heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 ` +
        `/Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`,
    );
    pushBytes(p.jpeg);
    pushStr("\nendstream\nendobj\n");
  });

  // Cross-reference table
  const xrefOffset = length;
  const size = totalObjects + 1;
  pushStr(`xref\n0 ${size}\n`);
  pushStr("0000000000 65535 f\r\n");
  for (let n = 1; n <= totalObjects; n++) {
    pushStr(`${String(offsets[n]).padStart(10, "0")} 00000 n\r\n`);
  }

  // Trailer
  pushStr(
    `trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  );

  // Concatenate all chunks.
  const out = new Uint8Array(length);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}

function round(n: number): string {
  return (Math.round(n * 100) / 100).toString();
}
