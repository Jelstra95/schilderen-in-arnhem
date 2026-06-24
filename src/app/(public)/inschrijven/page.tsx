import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { EnrollForm } from "@/components/EnrollForm";
import { getCourseDatesWithAvailability } from "@/lib/availability";
import type { CourseDateWithAvailability } from "@/lib/types";

export const metadata: Metadata = {
  title: "Inschrijven",
  description:
    "Kies een datum en schrijf je in voor een schildercursus in Arnhem.",
};

export default async function InschrijvenPage({
  searchParams,
}: {
  searchParams: Promise<{ datum?: string }>;
}) {
  const { datum } = await searchParams;

  let dates: CourseDateWithAvailability[] = [];
  try {
    dates = await getCourseDatesWithAvailability({
      upcomingOnly: true,
      openOnly: true,
    });
  } catch {
    // Supabase not configured — EnrollForm renders an empty state.
  }

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="max-w-2xl">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-clay">
            Inschrijven
          </p>
          <h1 className="font-title text-4xl text-ink sm:text-5xl">
            Reserveer je plek
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Kies hieronder een beschikbare datum en laat je gegevens achter. Je
            plek wordt direct voor je gereserveerd.
          </p>
        </div>

        <div className="mt-12">
          <EnrollForm dates={dates} preselectedId={datum} />
        </div>
      </Container>
    </section>
  );
}
