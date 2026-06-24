import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Bedankt voor je inschrijving",
};

export default function BedanktPage() {
  return (
    <section className="py-24">
      <Container className="max-w-2xl text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-clay/10 text-3xl text-clay">
          ✓
        </div>
        <h1 className="font-title text-4xl text-ink sm:text-5xl">
          Je plek is gereserveerd
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Bedankt voor je inschrijving! We hebben je aanmelding ontvangen en
          nemen persoonlijk contact met je op over de betaling en de verdere
          details. Zodra de betaling binnen is, krijg je toegang tot het
          cursusmateriaal.
        </p>
        <div className="mt-9 flex justify-center gap-3">
          <ButtonLink href="/">Terug naar de homepage</ButtonLink>
        </div>
      </Container>
    </section>
  );
}
