import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { AanmeldForm } from "@/components/AanmeldForm";

export const metadata: Metadata = {
  title: "Aanmelden",
  description:
    "Meld je aan voor de schildercursus in Arnhem. Kies je voorkeursavond en laat je gegevens achter.",
};

export default function InschrijvenPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="max-w-2xl">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-clay">
            Aanmelden
          </p>
          <h1 className="font-title text-4xl text-ink sm:text-5xl">
            Ik meld mij aan
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Kies je voorkeursavond en laat je gegevens achter. Ik neem daarna
            persoonlijk contact met je op over de startdatum, betaling en
            bevestiging.
          </p>
        </div>

        <div className="mt-12">
          <AanmeldForm />
        </div>
      </Container>
    </section>
  );
}
