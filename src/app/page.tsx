import type { Metadata } from "next";
import Link from "next/link";
import { LandingHero } from "@/components/LandingHero";
import { Logo } from "@/components/Logo";
import { JsonLd } from "@/components/JsonLd";
import { homeGraph } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Schilderen in Arnhem",
  description:
    "Schildercursussen en workshops in Arnhem. Leer schilderen in olieverf in een kleine groep, onder persoonlijke begeleiding van kunstenaar Jelle van de Ridder.",
  alternates: { canonical: "/" },
};

const actions = [
  {
    href: "/cursussen",
    label: "Cursussen",
    hint: "De doorlopende olieverfcursus in Arnhem",
  },
  {
    href: "/workshops",
    label: "Workshops",
    hint: "Verdiepende sessies op bijzondere locaties",
  },
  {
    href: "/login",
    label: "Cursusplatform",
    hint: "Inloggen voor cursisten",
  },
];

export default function HomePage() {
  return (
    <LandingHero>
      <JsonLd data={homeGraph()} />
      <div className="relative z-10 max-w-3xl text-center text-paper">
        <p className="mb-5 text-sm uppercase tracking-[0.25em] text-paper/70">
          Schildercursus · Arnhem
        </p>
        <Logo variant="paper" className="mx-auto mb-6 h-20 w-auto sm:h-24" />
        <h1 className="font-title text-5xl leading-[1.05] sm:text-7xl">
          Schilderen in Arnhem
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-paper/80">
          Leer schilderen in olieverf zoals de oude en nieuwe meesters dat
          deden. Je werkt in een kleine groep onder persoonlijke begeleiding van
          kunstenaar Jelle van de Ridder, in zijn atelier in Arnhem.
        </p>

        <div className="mt-11 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group inline-flex flex-col items-center rounded-xl border border-paper/50 bg-ink/20 px-7 py-3.5 font-body text-paper backdrop-blur-sm transition-colors duration-200 hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
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
