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
const lastUpdated = "15 oktober 2026";

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
            Fijn dat je meedoet aan de schildercursus. Hieronder staan de
            afspraken die we samen maken. Ze zijn er zodat het voor iedereen in
            de groep duidelijk en eerlijk blijft.
          </p>

          <div className="mt-16 space-y-14">
            <div data-reveal>
              <h2 className="font-title text-2xl text-ink">
                Afzeggen en inhalen
              </h2>
              <div className="mt-4 space-y-5 text-lg leading-relaxed text-muted">
                <p>
                  Kun je een keer niet? Dat kan gebeuren. Per lessenreeks mag je
                  één keer afzeggen, zonder dat je daar een reden voor hoeft te
                  geven. Die les haal je later in: hij schuift door naar het
                  einde van je reeks, zodat je er niets van mist.
                </p>
                <p>
                  Zeg je binnen dezelfde reeks nog een keer af, dan gaat die les
                  van je reeks af en kun je hem niet meer inhalen.
                </p>
              </div>
            </div>

            <div data-reveal>
              <h2 className="font-title text-2xl text-ink">Op tijd afzeggen</h2>
              <div className="mt-4 space-y-5 text-lg leading-relaxed text-muted">
                <p>
                  Laat het me uiterlijk de dag vóór de les weten. Zeg je op de
                  dag van de les zelf af, of kom je zonder bericht niet, dan
                  gaat de les van je reeks af. Dat geldt ook als het je eerste
                  keer afzeggen is.
                </p>
                <p>
                  In de groep is plek voor maximaal {site.course.maxStudents}{" "}
                  cursisten, en ik bereid iedere les voor op wie er komt. Door
                  op tijd af te zeggen houden we het overzichtelijk en eerlijk
                  voor iedereen.
                </p>
                <p>
                  Afzeggen doe je door te mailen naar{" "}
                  <a
                    href={`mailto:${site.email}`}
                    className="text-ink underline underline-offset-4 hover:text-clay"
                  >
                    {site.email}
                  </a>{" "}
                  of een bericht te sturen naar{" "}
                  <a
                    href={`tel:${site.phone}`}
                    className="text-ink underline underline-offset-4 hover:text-clay"
                  >
                    {site.phoneDisplay}
                  </a>
                  .
                </p>
              </div>
            </div>

            <aside
              data-reveal
              className="rounded-sm border-l-2 border-clay bg-mist/60 px-6 py-5"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-clay">
                Een voorbeeld
              </p>
              <p className="mt-3 leading-relaxed text-ink/80">
                Je reeks telt {site.course.lessons} lessen. In de derde week zeg
                je de dag ervoor af. Die les haal je in na je laatste les, dus
                je volgt nog steeds alle {site.course.lessons} lessen. Zeg je in
                de zesde week opnieuw af, dan gaat die les van je reeks af en
                volg je er in totaal {site.course.lessons - 1}.
              </p>
            </aside>

            <div data-reveal>
              <h2 className="font-title text-2xl text-ink">
                Aanmelden en betalen
              </h2>
              <div className="mt-4 space-y-5 text-lg leading-relaxed text-muted">
                <p>
                  Een les kost €{site.course.pricePerLesson}, een reeks van{" "}
                  {site.course.lessons} lessen dus €{coursePrice}. Materiaal is
                  niet inbegrepen.
                </p>
                <p>
                  Na je aanmelding neem ik persoonlijk contact met je op over de
                  startdatum en de betaling. Zodra de betaling binnen is, is je
                  plek bevestigd en krijg je toegang tot het cursusmateriaal op
                  het cursusplatform.
                </p>
              </div>
            </div>

            <p data-reveal className="text-muted">
              Heb je een vraag over deze afspraken? Mail me gerust op{" "}
              <a
                href={`mailto:${site.email}`}
                className="text-ink underline underline-offset-4 hover:text-clay"
              >
                {site.email}
              </a>
              .
            </p>

            <p className="text-sm text-muted">
              Laatst bijgewerkt: {lastUpdated}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
