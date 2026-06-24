import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { CourseDateManager } from "@/components/admin/CourseDateManager";
import { getCourseDatesWithAvailability } from "@/lib/availability";

export const metadata: Metadata = { title: "Cursusdata" };

export default async function AdminDataPage() {
  const dates = await getCourseDatesWithAvailability();

  return (
    <Container className="max-w-4xl">
      <h1 className="font-title text-4xl text-ink">Cursusdata</h1>
      <p className="mt-2 text-muted">
        Maak data aan, pas het aantal plekken aan of sluit de inschrijving.
      </p>
      <div className="mt-10">
        <CourseDateManager dates={dates} />
      </div>
    </Container>
  );
}
