import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { CancelEnrollmentButton } from "@/components/CancelEnrollmentButton";
import { getAuthContext } from "@/lib/auth";
import { capitalize, formatDate, formatTime } from "@/lib/format";
import type { CourseDate, Enrollment } from "@/lib/types";

export const metadata: Metadata = { title: "Mijn cursus" };

type Row = Enrollment & { course_date: CourseDate | null };

const statusLabel: Record<Enrollment["status"], string> = {
  pending: "In afwachting",
  confirmed: "Bevestigd",
  cancelled: "Geannuleerd",
};

export default async function DashboardPage() {
  const { supabase, user, profile } = await getAuthContext();

  const { data } = await supabase
    .from("enrollments")
    .select("*, course_date:course_dates(*)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const rows = (data as Row[] | null) ?? [];
  const active = rows.filter((r) => r.status !== "cancelled");
  const cancelled = rows.filter((r) => r.status === "cancelled");

  return (
    <Container className="max-w-3xl">
      <header className="mb-10">
        <h1 className="font-title text-4xl text-ink">
          Welkom{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="mt-2 text-muted">
          Hier vind je je inschrijvingen en het cursusmateriaal.
        </p>
        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className="mt-3 inline-block text-sm text-clay hover:underline"
          >
            → Naar het beheer
          </Link>
        )}
      </header>

      {active.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-mist/40 p-10 text-center">
          <p className="text-muted">Je hebt nog geen actieve inschrijving.</p>
          <div className="mt-4 flex justify-center">
            <ButtonLink href="/inschrijven" size="sm">
              Bekijk de cursusdata
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {active.map((row) => (
            <article
              key={row.id}
              className="rounded-2xl border border-line bg-paper p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-2">
                    <Badge tone={row.status === "confirmed" ? "confirmed" : "pending"}>
                      {statusLabel[row.status]}
                    </Badge>
                  </div>
                  <p className="font-title text-xl text-ink">
                    {row.course_date?.title ?? "Cursus"}
                  </p>
                  {row.course_date && (
                    <p className="mt-1 text-sm text-muted">
                      {capitalize(formatDate(row.course_date.starts_at))} ·{" "}
                      {formatTime(row.course_date.starts_at)}
                      {row.course_date.location
                        ? ` · ${row.course_date.location}`
                        : ""}
                    </p>
                  )}
                </div>
                <CancelEnrollmentButton id={row.id} />
              </div>
              {row.status === "pending" && (
                <p className="mt-4 rounded-xl bg-mist/60 px-4 py-3 text-sm text-muted">
                  Je plek is gereserveerd. Zodra de betaling verwerkt is, wordt
                  je inschrijving bevestigd en krijg je toegang tot het
                  materiaal.
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {cancelled.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-sm uppercase tracking-wide text-muted">
            Geannuleerd
          </h2>
          <ul className="space-y-2 text-sm text-muted">
            {cancelled.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between rounded-xl border border-line/60 px-4 py-3"
              >
                <span>{row.course_date?.title ?? "Cursus"}</span>
                {row.course_date && (
                  <span>{formatDate(row.course_date.starts_at)}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}
