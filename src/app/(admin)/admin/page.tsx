import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getAuthContext } from "@/lib/auth";

export const metadata: Metadata = { title: "Beheer" };

export default async function AdminOverviewPage() {
  const { supabase } = await getAuthContext();
  const nowIso = new Date().toISOString();

  const [upcomingRes, pendingRes, confirmedRes, materialsRes] =
    await Promise.all([
      supabase
        .from("course_dates")
        .select("*", { count: "exact", head: true })
        .gte("starts_at", nowIso),
      supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("status", "confirmed"),
      supabase.from("materials").select("*", { count: "exact", head: true }),
    ]);

  const pending = pendingRes.count ?? 0;
  const stats = [
    { label: "Aankomende data", value: upcomingRes.count ?? 0, href: "/admin/data" },
    { label: "Open aanmeldingen", value: pending, href: "/admin/deelnemers" },
    {
      label: "Bevestigde deelnemers",
      value: confirmedRes.count ?? 0,
      href: "/admin/deelnemers",
    },
    { label: "Materialen", value: materialsRes.count ?? 0, href: "/admin/materiaal" },
  ];

  return (
    <Container>
      <h1 className="font-title text-4xl text-ink">Overzicht</h1>
      <p className="mt-2 text-muted">
        Beheer cursusdata, deelnemers en lesmateriaal.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-line bg-paper p-6 transition-shadow hover:shadow-[0_8px_30px_rgba(22,19,15,0.06)]"
          >
            <p className="font-title text-4xl text-ink">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      {pending > 0 && (
        <div className="mt-8 rounded-2xl border border-clay/30 bg-clay/5 p-6">
          <p className="text-ink">
            Er {pending === 1 ? "is" : "zijn"}{" "}
            <strong>
              {pending} open {pending === 1 ? "aanmelding" : "aanmeldingen"}
            </strong>{" "}
            die wachten op bevestiging.
          </p>
          <Link
            href="/admin/deelnemers"
            className="mt-2 inline-block text-sm text-clay hover:underline"
          >
            → Naar de deelnemers
          </Link>
        </div>
      )}
    </Container>
  );
}
