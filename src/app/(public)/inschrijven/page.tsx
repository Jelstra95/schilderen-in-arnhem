import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { AanmeldForm } from "@/components/AanmeldForm";
import { delay } from "@/lib/motion";
import { inschrijven } from "@/content/aanmelden";

export const metadata: Metadata = {
  ...inschrijven.meta,
  alternates: { canonical: "/inschrijven" },
};

export default function InschrijvenPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="rise max-w-2xl">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-clay">
            {inschrijven.eyebrow}
          </p>
          <h1 className="font-title text-4xl text-ink sm:text-5xl">
            {inschrijven.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            {inschrijven.intro}
          </p>
        </div>

        <div className="rise mt-12" style={delay(180)}>
          <AanmeldForm />
        </div>
      </Container>
    </section>
  );
}
