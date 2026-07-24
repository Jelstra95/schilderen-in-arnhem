"use client";

import { useCallback, useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import pleinAir1 from "@/assets/cursus/plein-air-1.jpg";
import pleinAir2 from "@/assets/cursus/plein-air-2.jpg";
import portret1 from "@/assets/cursus/portret-1.jpg";

type Slide = { src: StaticImageData; alt: string };

const slides: Slide[] = [
  { src: pleinAir1, alt: "Cursisten schilderen in de buitenlucht tijdens een plein-airsessie" },
  { src: pleinAir2, alt: "Plein-air schilderen op locatie met de cursusgroep" },
  { src: portret1, alt: "Portretstudie geschilderd tijdens de cursus" },
];

const kenburns = ["kenburns-a", "kenburns-b", "kenburns-c"];
const AUTOPLAY_MS = 6000;

export function CourseCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) => setIndex((next + slides.length) % slides.length),
    [],
  );

  // Auto-advance; the timer resets whenever the index changes or on hover/focus.
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => go(index + 1), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [index, paused, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "ArrowRight") go(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  return (
    <div
      className="group relative"
      role="region"
      aria-roledescription="carousel"
      aria-label="Impressie van de cursus"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-mist">
        {slides.map((slide, i) => (
          <div
            key={slide.alt}
            className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              placeholder="blur"
              priority={i === 0}
              className={`object-cover ${kenburns[i % kenburns.length]}`}
            />
          </div>
        ))}
      </div>

      {/* Prev / next -------------------------------------------------- */}
      <button
        type="button"
        onClick={() => go(index - 1)}
        aria-label="Vorige foto"
        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md border border-line bg-paper/90 text-ink shadow-sm transition hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => go(index + 1)}
        aria-label="Volgende foto"
        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md border border-line bg-paper/90 text-ink shadow-sm transition hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dots --------------------------------------------------------- */}
      <div className="mt-5 flex justify-center gap-2.5">
        {slides.map((slide, i) => (
          <button
            key={slide.alt}
            type="button"
            onClick={() => go(i)}
            aria-label={`Ga naar foto ${i + 1}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-clay" : "w-2 bg-line hover:bg-muted/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
