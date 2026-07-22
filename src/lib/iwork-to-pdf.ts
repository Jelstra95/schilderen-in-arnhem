// Client-side conversion of Apple Pages/Keynote documents to PDF.
//
// `.pages` and `.key` files are ZIP bundles. When saved with previews enabled
// (the default on macOS), they contain a full-document `QuickLook/Preview.pdf`
// — the same PDF Finder/QuickLook renders. We extract that entry in the browser
// so the admin can drop a Pages/Keynote file and a real PDF gets uploaded, with
// no server-side conversion runner required.

import { unzip, type Unzipped } from "fflate";

/** True for files we can attempt to convert (by extension). */
export function isIWorkFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".pages") || name.endsWith(".key");
}

/** "Keynote" | "Pages" for building user-facing guidance. */
export function iworkAppName(file: File): "Keynote" | "Pages" {
  return file.name.toLowerCase().endsWith(".key") ? "Keynote" : "Pages";
}

/** Thrown when no embedded PDF preview can be extracted. */
export class IWorkConversionError extends Error {}

const PREVIEW_PATH = /(^|\/)quicklook\/preview\.pdf$/i;

/**
 * Extracts the embedded PDF preview from a Pages/Keynote file and returns it as
 * a PDF `File`. Throws {@link IWorkConversionError} when the bundle has no
 * preview (previews disabled, or an old single-flat-file format).
 */
export async function iworkToPdf(file: File): Promise<File> {
  const buf = new Uint8Array(await file.arrayBuffer());

  // ZIP local-file-header signature "PK\x03\x04". Older flat-file iWork
  // documents aren't ZIPs and have no extractable preview.
  if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b) {
    throw new IWorkConversionError("Geen ingesloten PDF-voorbeeld gevonden.");
  }

  const preview = await new Promise<Uint8Array | null>((resolve, reject) => {
    // `filter` decompresses only the preview entry, never the embedded media.
    unzip(buf, { filter: (f) => PREVIEW_PATH.test(f.name) }, (err, files: Unzipped) => {
      if (err) return reject(err);
      const key = Object.keys(files).find((k) => PREVIEW_PATH.test(k));
      resolve(key ? files[key] : null);
    });
  });

  if (!preview || preview.length === 0) {
    throw new IWorkConversionError("Geen ingesloten PDF-voorbeeld gevonden.");
  }

  const base = file.name.replace(/\.(pages|key)$/i, "");
  return new File([preview as BlobPart], `${base}.pdf`, {
    type: "application/pdf",
  });
}
