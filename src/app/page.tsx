import type { Metadata } from "next";
import Link from "next/link";
import { LandingHero } from "@/components/LandingHero";
import { Logo } from "@/components/Logo";
import { JsonLd } from "@/components/JsonLd";
import { homeGraph } from "@/lib/schema";
import { delay } from "@/lib/motion";
import { home } from "@/content/home";

export const metadata: Metadata = {
  ...home.meta,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <LandingHero>
      <JsonLd data={homeGraph()} />
      <div className="relative z-10 max-w-3xl text-center text-paper">
        <p className="rise mb-5 text-sm uppercase tracking-[0.25em] text-paper/70">
          {home.eyebrow}
        </p>
        <div className="rise" style={delay(120)}>
          <Logo variant="paper" className="mx-auto mb-6 h-20 w-auto sm:h-24" />
        </div>
        <h1
          className="rise font-title text-5xl leading-[1.05] sm:text-7xl"
          style={delay(240)}
        >
          {home.title}
        </h1>
        <p
          className="rise mx-auto mt-6 max-w-xl text-lg leading-relaxed text-paper/80"
          style={delay(380)}
        >
          {home.intro}
        </p>

        <div className="mt-11 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          {home.actions.map((a, i) => (
            <Link
              key={a.href}
              href={a.href}
              style={delay(560 + i * 110)}
              className="rise group inline-flex flex-col items-center rounded-xl border border-paper/50 bg-ink/20 px-7 py-3.5 font-body text-paper backdrop-blur-sm transition-colors duration-200 hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              <span className="text-base">{a.label}</span>
              <span className="mt-0.5 text-xs text-paper/60 group-hover:text-ink/60">
                {a.hint}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </LandingHero>
  );
}
