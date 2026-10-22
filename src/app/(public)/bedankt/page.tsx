import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { bedankt } from "@/content/aanmelden";

export const metadata: Metadata = {
  ...bedankt.meta,
  // Not useful in search: a confirmation page or an auth screen.
  robots: { index: false, follow: true },
};

export default function BedanktPage() {
  return (
    <section className="py-24">
      <Container>
        <div className="rise mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-clay/10 text-3xl text-clay">
            ✓
          </div>
          <h1 className="font-title text-4xl text-ink sm:text-5xl">
            {bedankt.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            {bedankt.text}
          </p>
          <div className="mt-9 flex justify-center gap-3">
            <ButtonLink href={bedankt.button.href}>
              {bedankt.button.label}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
