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
        .from("course_inquiries")
        .select("*", { count: "exact", head: true })
        .eq("status", "new")
        .eq("responded", false),
      supabase
        .from("course_inquiries")
        .select("*", { count: "exact", head: true })
        .in("status", ["converted", "participated"]),
      supabase.from("materials").select("*", { count: "exact", head: true }),
    ]);

  const pending = pendingRes.count ?? 0;
  const stats = [
    { label: "Aankomende data", value: upcomingRes.count ?? 0, href: "/admin/data" },
    { label: "Nieuwe aanvragen", value: pending, href: "/admin/aanvragen" },
    {
      label: "Deelnemers",
      value: confirmedRes.count ?? 0,
      href: "/admin/aanvragen",
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
            className="rounded-xl border border-line bg-paper p-6 transition-shadow hover:shadow-[0_8px_30px_rgba(22,19,15,0.06)]"
          >
            <p className="font-title text-4xl text-ink">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      {pending > 0 && (
        <div className="mt-8 rounded-xl border border-clay/30 bg-clay/5 p-6">
          <p className="text-ink">
            Er {pending === 1 ? "is" : "zijn"}{" "}
            <strong>
              {pending} nieuwe {pending === 1 ? "aanvraag" : "aanvragen"}
            </strong>{" "}
            die nog op een reactie {pending === 1 ? "wacht" : "wachten"}.
          </p>
          <Link
            href="/admin/aanvragen"
            className="mt-2 inline-block text-sm text-clay hover:underline"
          >
            Naar de aanvragen
          </Link>
        </div>
      )}
    </Container>
  );
}
