"use client";

import Link from "next/link";
import { PdfPageCanvas } from "@/components/PdfPageCanvas";

/**
 * Student-facing lesson tile: the PDF's second page (whose slide carries a nice
 * background image) fills the tile, with the lesson title centered on top and a
 * strong drop shadow for legibility. Non-PDF materials use the image itself.
 */
export function MaterialTile({
  id,
  title,
  subtitle,
  isPdf,
}: {
  id: string;
  title: string;
  subtitle?: string;
  isPdf: boolean;
}) {
  const src = `/api/materials/${id}/stream`;

  return (
    <Link
      href={`/materiaal/${id}`}
      className="group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-line bg-ink shadow-sm transition-shadow hover:shadow-[0_12px_40px_rgba(22,19,15,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/50 focus-visible:ring-offset-2"
    >
      {/* Background: PDF page 2, or the image itself. */}
      {isPdf ? (
        <PdfPageCanvas
          src={src}
          page={2}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-cover"
        />
      )}

      {/* Subtle scrim so titles stay legible over any image. */}
      <div className="absolute inset-0 bg-ink/20 transition-colors group-hover:bg-ink/30" />

      {/* Title (+ optional subtitle) centered on top. */}
      <div className="relative z-10 px-6 text-center">
        <h3 className="font-title text-2xl leading-tight text-paper [text-shadow:0_2px_10px_rgba(0,0,0,0.75)]">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-sm text-paper/90 [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">
            {subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}
