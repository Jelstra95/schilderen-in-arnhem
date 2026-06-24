import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import {
  ParticipantsManager,
  type EnrollmentRow,
} from "@/components/admin/ParticipantsManager";
import { getAuthContext } from "@/lib/auth";

export const metadata: Metadata = { title: "Deelnemers" };

export default async function AdminParticipantsPage() {
  const { supabase } = await getAuthContext();

  const { data } = await supabase
    .from("enrollments")
    .select("*, course_date:course_dates(*)")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  const rows = (data as EnrollmentRow[] | null) ?? [];

  return (
    <Container className="max-w-5xl">
      <h1 className="font-title text-4xl text-ink">Deelnemers</h1>
      <p className="mt-2 text-muted">
        Bevestig een aanmelding zodra de betaling binnen is. Daarmee maak je het
        account aan en krijgt de deelnemer toegang tot het materiaal.
      </p>
      <div className="mt-10">
        <ParticipantsManager rows={rows} />
      </div>
    </Container>
  );
}
