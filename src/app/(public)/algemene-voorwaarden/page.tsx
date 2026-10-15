import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { site, coursePrice } from "@/lib/site";
import { delay } from "@/lib/motion";

export const metadata: Metadata = {
  title: "Algemene voorwaarden",
  description:
    "De afspraken voor de schildercursus in Arnhem: hoe afzeggen en inhalen werkt, en hoe aanmelden en betalen gaat.",
  alternates: { canonical: "/algemene-voorwaarden" },
};

/** Shown on the page, so update it together with any change to the terms. */
const lastUpdated = "16 oktober 2026";

const summary = [
  {
    title: "Eén keer vrij",
    body: "Eén keer per reeks afzeggen mag zonder opgave van reden. Die les haal je later in.",
  },
  {
    title: "De dag ervoor",
    body: "Laat het me uiterlijk de dag vóór de les weten.",
  },
  {
    title: "Daarna telt het",
    body: "Nog een keer afzeggen, of pas op de dag zelf, gaat van je reeks af.",
  },
];

const linkClass = "text-ink underline underline-offset-4 hover:text-clay";

export default function VoorwaardenPage() {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <div className="max-w-2xl">
          <p className="rise mb-4 text-sm uppercase tracking-[0.2em] text-clay">
            Afspraken
          </p>
          <h1
            className="rise font-title text-4xl text-ink sm:text-5xl"
            style={delay(120)}
          >
            Algemene voorwaarden
          </h1>
          <p
            className="rise mt-6 text-lg leading-relaxed text-muted"
            style={delay(260)}
          >
            Een paar heldere afspraken, zodat het voor iedereen in de groep
            duidelijk en eerlijk is.
          </p>
        </div>

        {/* In het kort ------------------------------------------------- */}
        <div
          data-reveal-stagger
          className="mt-14 grid max-w-4xl gap-4 sm:grid-cols-3"
        >
          {summary.map((item, i) => (
            <div
              key={item.title}
              data-reveal
              className="border-t-2 border-clay bg-mist/60 px-5 pt-4 pb-5"
            >
              <span className="font-title text-3xl text-clay/60">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 font-title text-lg text-ink">{item.title}</p>
              <p className="mt-1 leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 max-w-2xl space-y-14">
          <div data-reveal>
            <h2 className="font-title text-2xl text-ink">
              Afzeggen en inhalen
            </h2>
            <div className="mt-4 space-y-5 text-lg leading-relaxed text-muted">
              <p>
                Per lessenreeks mag je één keer afzeggen, zonder dat je daar een
                reden voor hoeft te geven. Die les raak je niet kwijt: hij
                schuift door naar het einde van je reeks en je haalt hem dan in.
              </p>
              <p>
                Zeg je in dezelfde reeks nog een keer af, dan gaat die les van
                je reeks af. Zo blijft het eerlijk voor de rest van de groep.
              </p>
            </div>
          </div>

          <div data-reveal>
            <h2 className="font-title text-2xl text-ink">Op tijd afzeggen</h2>
            <div className="mt-4 space-y-5 text-lg leading-relaxed text-muted">
              <p>
                Zeg uiterlijk de dag vóór de les af. Dan kan ik daar bij het
                voorbereiden van de les rekening mee houden.
              </p>
              <p>
                Zeg je op de dag zelf af, of kom je niet zonder iets te laten
                horen, dan gaat de les van je reeks af. Ook als het je eerste
                keer is.
              </p>
              <p>
                Afzeggen kan per mail naar{" "}
                <a href={`mailto:${site.email}`} className={linkClass}>
                  {site.email}
                </a>{" "}
                of met een bericht naar{" "}
                <a href={`tel:${site.phone}`} className={linkClass}>
                  {site.phoneDisplay}
                </a>
                .
              </p>
            </div>
          </div>

          <SeriesExample />

          <div data-reveal>
            <h2 className="font-title text-2xl text-ink">
              Aanmelden en betalen
            </h2>
            <div className="mt-4 space-y-5 text-lg leading-relaxed text-muted">
              <p>
                Een les kost €{site.course.pricePerLesson}. Een reeks van{" "}
                {site.course.lessons} lessen kost dus €{coursePrice}. Materiaal
                is niet inbegrepen. Dat schaf je zelf aan en het blijft daarna
                van jou.
              </p>
              <p>
                Na je aanmelding neem ik persoonlijk contact met je op over de
                startdatum en de betaling. Zodra die binnen is, staat je plek
                vast en krijg je toegang tot het cursusplatform.
              </p>
            </div>
          </div>

          <p data-reveal className="text-lg text-muted">
            Heb je een vraag over deze afspraken? Mail me gerust op{" "}
            <a href={`mailto:${site.email}`} className={linkClass}>
              {site.email}
            </a>
            .
          </p>

          <p className="text-sm text-muted">Laatst bijgewerkt: {lastUpdated}</p>
        </div>
      </Container>
    </section>
  );
}

type Dot = { n: number; state: "attended" | "skipped" | "caughtUp" | "lost" };

/**
 * The cancellation rules drawn as a row of lessons, once with a single
 * cancellation and once with two. Built from site.course.lessons, so the
 * picture stays right if the series length changes.
 */
function SeriesExample() {
  const lessons = site.course.lessons;
  const base = (skipped: number[], lost: number[]): Dot[] =>
    Array.from({ length: lessons }, (_, i) => {
      const n = i + 1;
      if (skipped.includes(n)) return { n, state: "skipped" };
      if (lost.includes(n)) return { n, state: "lost" };
      return { n, state: "attended" };
    });

  const rows = [
    {
      label: "Je zegt één keer op tijd af",
      dots: [...base([3], []), { n: 3, state: "caughtUp" } as Dot],
      result: `Je volgt alle ${lessons} lessen`,
    },
    {
      label: "Je zegt een tweede keer af",
      dots: [...base([3], [6]), { n: 3, state: "caughtUp" } as Dot],
      result: `Je volgt ${lessons - 1} lessen`,
    },
  ];

  return (
    <aside data-reveal className="border-l-2 border-clay bg-mist/60 px-6 py-6">
      <p className="text-sm uppercase tracking-[0.2em] text-clay">
        Zo ziet dat eruit
      </p>
      <div className="mt-5 space-y-6">
        {rows.map((row) => (
          <div key={row.label}>
            <p className="text-ink">{row.label}</p>
            <ol className="mt-3 flex flex-wrap items-center gap-1.5">
              {row.dots.map((dot, i) => (
                <li key={i} className="flex items-center">
                  {dot.state === "caughtUp" && (
                    <span aria-hidden className="mr-1.5 text-clay">
                      +
                    </span>
                  )}
                  <span
                    aria-label={dotLabel(dot)}
                    className={`flex size-6 items-center justify-center rounded-full text-[0.7rem] tabular-nums ${dotClass[dot.state]}`}
                  >
                    {dot.n}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-sm text-muted">{row.result}</p>
          </div>
        ))}
      </div>
      <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
        <Legend state="attended">gevolgd</Legend>
        <Legend state="skipped">afgezegd</Legend>
        <Legend state="caughtUp">ingehaald</Legend>
        <Legend state="lost">vervallen</Legend>
      </ul>
    </aside>
  );
}

const dotClass: Record<Dot["state"], string> = {
  attended: "bg-ink/80 text-paper",
  skipped: "border border-dashed border-ink/40 text-ink/50",
  caughtUp: "bg-clay text-paper",
  lost: "border border-ink/20 text-ink/30 line-through",
};

function dotLabel(dot: Dot) {
  const what = {
    attended: "gevolgd",
    skipped: "afgezegd",
    caughtUp: "ingehaald",
    lost: "vervallen",
  }[dot.state];
  return `Les ${dot.n}, ${what}`;
}

function Legend({
  state,
  children,
}: {
  state: Dot["state"];
  children: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden className={`size-3 rounded-full ${dotClass[state]}`} />
      {children}
    </li>
  );
}
