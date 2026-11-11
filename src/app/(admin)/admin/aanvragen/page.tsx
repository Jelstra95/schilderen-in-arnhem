import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PeopleManager, type Person } from "@/components/admin/PeopleManager";
import { createAdminClient, missingAdminEnv } from "@/lib/supabase/admin";
import type { CourseInquiry, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Aanvragen en deelnemers" };

function Notice({
  tone,
  title,
  children,
}: {
  tone: "amber" | "red";
  title: string;
  children: React.ReactNode;
}) {
  const cls =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-red-200 bg-red-50 text-red-800";
  return (
    <Container className="max-w-5xl">
      <h1 className="font-title text-4xl text-ink">Aanvragen en deelnemers</h1>
      <div className={`mt-8 rounded-lg border p-6 ${cls}`}>
        <p className="font-title text-lg">{title}</p>
        <p className="mt-2 text-sm">{children}</p>
      </div>
    </Container>
  );
}

export default async function AdminInquiriesPage() {
  const missingEnv = missingAdminEnv();
  if (missingEnv) {
    return (
      <Notice tone="amber" title="Deze pagina is niet beschikbaar">
        De serverinstelling <code className="font-mono">{missingEnv}</code>{" "}
        ontbreekt in deze omgeving. Voeg deze toe bij de omgevingsvariabelen
        (Vercel → Project → Settings → Environment Variables) en deploy
        opnieuw.
      </Notice>
    );
  }

  const admin = createAdminClient();
  const [inquiriesRes, profilesRes, authList] = await Promise.all([
    admin
      .from("course_inquiries")
      .select("*")
      .order("status", { ascending: true })
      .order("created_at", { ascending: false }),
    admin.from("profiles").select("*").eq("role", "participant"),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  // Surface query errors loudly. An empty list would make the owner think
  // there are no inquiries while the database was simply unreachable.
  const error = inquiriesRes.error ?? profilesRes.error;
  if (error) {
    return (
      <Notice tone="red" title="De lijst kon niet geladen worden">
        De database gaf een fout:{" "}
        <code className="font-mono">{error.message}</code>. Herlaad de pagina.
        Als de fout blijft, is er een probleem met Supabase of met deze deploy.
      </Notice>
    );
  }

  const rows = (inquiriesRes.data as CourseInquiry[] | null) ?? [];

  // The linked-account columns arrive with migration 0006. Without them the
  // page cannot show who is a participant, so say so plainly.
  if (rows.length > 0 && !("user_id" in rows[0])) {
    return (
      <Notice tone="amber" title="De database mist nog een update">
        Voer{" "}
        <code className="font-mono">
          supabase/migrations/0006_inquiries_as_participants.sql
        </code>{" "}
        uit in de Supabase SQL editor en herlaad de pagina.
      </Notice>
    );
  }

  const profiles = new Map<string, Profile>();
  for (const p of (profilesRes.data as Profile[] | null) ?? []) {
    profiles.set(p.id, p);
  }
  const lastSignIn = new Map<string, string | null>();
  for (const u of authList.data?.users ?? []) {
    lastSignIn.set(u.id, u.last_sign_in_at ?? null);
  }

  const people: Person[] = rows.map((row) => {
    const profile = row.user_id ? profiles.get(row.user_id) : undefined;
    return {
      ...row,
      access_starts_on: profile?.access_starts_on ?? null,
      access_ends_on: profile?.access_ends_on ?? null,
      last_sign_in_at: row.user_id ? (lastSignIn.get(row.user_id) ?? null) : null,
    };
  });

  return (
    <Container className="max-w-5xl">
      <h1 className="font-title text-4xl text-ink">Aanvragen en deelnemers</h1>
      <p className="mt-2 text-muted">
        Iedereen die zich via <code className="font-mono">/inschrijven</code>{" "}
        aanmeldt, komt hier binnen. Met een klik maak je er een deelnemer van.
        Er wordt dan een account aangemaakt op hun e-mailadres met het
        wachtwoord <span className="font-mono text-ink">olieverf</span>.
      </p>
      <div className="mt-10">
        <PeopleManager people={people} />
      </div>
    </Container>
  );
}
