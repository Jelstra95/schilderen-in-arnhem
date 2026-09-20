import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Schilderworkshops in Arnhem",
  description:
    "Losse schilderworkshops in olieverf in en rond Arnhem, op bijzondere locaties. Binnenkort verschijnt hier de agenda met de geplande workshops.",
  alternates: { canonical: "/workshops" },
};

export default function WorkshopsPage() {
  return (
    <section className="py-24 sm:py-32">
      <Container className="max-w-2xl">
        <p className="mb-4 text-sm uppercase tracking-[0.2em] text-clay">
          Binnenkort
        </p>
        <h1 className="font-title text-4xl text-ink sm:text-5xl">
          Schilderworkshops in Arnhem
        </h1>
        <div className="mt-6 space-y-5 text-lg leading-relaxed text-muted">
          <p>
            Naast de doorlopende schildercursus komen er losse workshops. Waar
            de cursus acht lessen beslaat en je stap voor stap een brede basis
            geeft, duurt een workshop één dagdeel en gaat die juist heel diep op
            één onderwerp in.
          </p>
          <p>
            Ook in de workshops werk je in olieverf. Denk aan een middag die
            volledig over het schilderen van licht gaat, aan een portretstudie
            naar levend model, of aan een dag buiten schilderen op locatie. Je
            hoeft er geen cursus voor te volgen en je hoeft geen ervaring te
            hebben.
          </p>
          <p>
            De workshops vinden plaats op bijzondere locaties in en rond Arnhem.
            Een enkele keer werken we in het atelier aan de Schrassertstraat,
            maar vaker trekken we eropuit naar een plek die zich leent voor het
            onderwerp van die dag.
          </p>
          <p>
            Binnenkort verschijnt hier de agenda met de geplande workshops, met
            per workshop de datum, de locatie en de kosten. Heb je alvast
            interesse, of ken je een locatie die zich hiervoor leent? Neem dan
            gerust contact op.
          </p>
        </div>
        <div className="mt-9 flex flex-wrap gap-4">
          <ButtonLink href="/cursussen">Bekijk de cursus</ButtonLink>
          <ButtonLink
            href="mailto:info@jellevanderidder.com"
            variant="secondary"
          >
            Neem contact op
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
