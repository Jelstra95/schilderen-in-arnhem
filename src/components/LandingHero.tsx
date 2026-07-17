"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image, { type StaticImageData } from "next/image";
import pleinAir1 from "@/assets/cursus/plein-air-1.jpg";
import pleinAir2 from "@/assets/cursus/plein-air-2.jpg";

const slides: StaticImageData[] = [pleinAir1, pleinAir2];
const kenburns = ["kenburns-a", "kenburns-b", "kenburns-c"];
const AUTOPLAY_MS = 6000;

export function LandingHero({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      AUTOPLAY_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-24">
      {/* Background carousel ----------------------------------------- */}
      <div className="absolute inset-0 z-0">
        {slides.map((src, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-[1500ms] ease-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={src}
              alt=""
              fill
              priority={i === 0}
              placeholder="blur"
              sizes="100vw"
              className={`object-cover ${kenburns[i % kenburns.length]}`}
            />
          </div>
        ))}
        {/* Darkening overlay for legible foreground text */}
        <div className="absolute inset-0 bg-ink/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-ink/40" />
      </div>

      {children}
    </section>
  );
}
