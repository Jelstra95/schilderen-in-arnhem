"use client";

import { useEffect, useState } from "react";
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

/**
 * Self-running slideshow: each new photo is painted over the previous one
 * with a brush-stroke mask (see `.brush-in` in globals.css). No controls.
 */
export function CourseCarousel() {
  const [{ index, prev }, setState] = useState<{
    index: number;
    prev: number | null;
  }>({ index: 0, prev: null });

  useEffect(() => {
    const id = setInterval(() => {
      setState(({ index: i }) => ({
        index: (i + 1) % slides.length,
        prev: i,
      }));
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      aria-label="Impressie van de cursus"
      className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-mist"
    >
      {slides.map((slide, i) => {
        const current = i === index;
        const below = i === prev;
        return (
          <div
            key={slide.alt}
            aria-hidden={!current}
            className={`absolute inset-0 ${
              current
                ? `z-10 ${prev !== null ? "brush-in" : ""}`
                : below
                  ? "z-0"
                  : "invisible"
            }`}
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
        );
      })}
    </div>
  );
}
