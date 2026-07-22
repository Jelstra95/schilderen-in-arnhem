import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import {
  ParticipantsManager,
  type EnrollmentRow,
} from "@/components/admin/ParticipantsManager";
import {
  ParticipantAccountsManager,
  type ParticipantAccount,
} from "@/components/admin/ParticipantAccountsManager";
import { getAuthContext } from "@/lib/auth";
import { createAdminClient, missingAdminEnv } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Deelnemers" };

export default async function AdminParticipantsPage() {
  const { supabase } = await getAuthContext();

  // The accounts panel needs the service-role client. If its env var is absent
  // in this environment, show a clear message instead of a raw 500.
  const missingEnv = missingAdminEnv();
  if (missingEnv) {
    return (
      <Container className="max-w-5xl">
        <h1 className="font-title text-4xl text-ink">Deelnemers</h1>
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-title text-lg text-amber-900">
            Deelnemersbeheer is niet beschikbaar
          </p>
          <p className="mt-2 text-sm text-amber-800">
            De serverinstelling <code className="font-mono">{missingEnv}</code>{" "}
            ontbreekt in deze omgeving. Voeg deze toe bij de
            omgevingsvariabelen (Vercel → Project → Settings → Environment
            Variables) en deploy opnieuw.
          </p>
        </div>
      </Container>
    );
  }

  const admin = createAdminClient();

  // Participant accounts (profiles) + last sign-in from the auth system.
  const [{ data: profiles }, authList] = await Promise.all([
    admin
      .from("profiles")
      .select("*")
      .eq("role", "participant")
      .order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const lastSignIn = new Map<string, string | null>();
  for (const u of authList.data?.users ?? []) {
    lastSignIn.set(u.id, u.last_sign_in_at ?? null);
  }

  const accounts: ParticipantAccount[] = (
    (profiles as Profile[] | null) ?? []
  ).map((p) => ({ ...p, last_sign_in_at: lastSignIn.get(p.id) ?? null }));

  // Enrollments from the public sign-up form (existing confirm-on-payment flow).
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*, course_date:course_dates(*)")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  const rows = (enrollments as EnrollmentRow[] | null) ?? [];

  return (
    <Container className="max-w-5xl">
      <h1 className="font-title text-4xl text-ink">Deelnemers</h1>
      <p className="mt-2 text-muted">
        Maak deelnemersaccounts aan en beheer hun cursusperiode. Een deelnemer
        ziet alleen materiaal met een datum binnen zijn of haar periode.
      </p>
      <div className="mt-10">
        <ParticipantAccountsManager accounts={accounts} />
      </div>

      <section className="mt-16">
        <h2 className="font-title text-2xl text-ink">Aanmeldingen via de site</h2>
        <p className="mt-1 text-sm text-muted">
          Bevestig een aanmelding zodra de betaling binnen is. Daarmee maak je
          het account aan en krijgt de deelnemer toegang tot het materiaal.
        </p>
        <div className="mt-6">
          <ParticipantsManager rows={rows} />
        </div>
      </section>
    </Container>
  );
}
