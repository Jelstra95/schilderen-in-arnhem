import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Workshops",
  description:
    "Losse schilderworkshops op bijzondere locaties. Binnenkort verschijnt hier de agenda.",
};

export default function WorkshopsPage() {
  return (
    <section className="py-24 sm:py-32">
      <Container className="max-w-2xl text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.2em] text-clay">
          Binnenkort
        </p>
        <h1 className="font-title text-4xl text-ink sm:text-5xl">Workshops</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">
          Naast de doorlopende cursus komen er losse workshops: verdiepende
          sessies die dieper op een onderwerp ingaan en plaatsvinden op
          bijzondere locaties. Binnenkort verschijnt hier een agenda met de
          geplande workshops.
        </p>
        <p className="mt-4 leading-relaxed text-muted">
          Alvast interesse of een idee voor een locatie? Neem gerust contact op.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
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
