import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { RichText } from "@/components/RichText";
import { delay } from "@/lib/motion";
import { workshops } from "@/content/workshops";

export const metadata: Metadata = {
  ...workshops.meta,
  alternates: { canonical: "/workshops" },
};

export default function WorkshopsPage() {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <div className="max-w-2xl">
          <p className="rise mb-4 text-sm uppercase tracking-[0.2em] text-clay">
            {workshops.eyebrow}
          </p>
          <h1
            className="rise font-title text-4xl text-ink sm:text-5xl"
            style={delay(120)}
          >
            {workshops.title}
          </h1>
          <div
            className="rise mt-6 space-y-5 text-lg leading-relaxed text-muted"
            style={delay(260)}
          >
            {workshops.paragraphs.map((p) => (
              <p key={p}>
                <RichText text={p} />
              </p>
            ))}
          </div>
          <div className="rise mt-9 flex flex-wrap gap-4" style={delay(400)}>
            <ButtonLink href={workshops.primaryCta.href}>
              {workshops.primaryCta.label}
            </ButtonLink>
            <ButtonLink href={workshops.secondaryCta.href} variant="secondary">
              {workshops.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
