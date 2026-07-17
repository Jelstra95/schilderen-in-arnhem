import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getAuthContext } from "@/lib/auth";
import { capitalize, formatDate } from "@/lib/format";
import type { CourseDate, Material } from "@/lib/types";

export const metadata: Metadata = { title: "Cursusmateriaal" };

type Row = Material & { course_date: CourseDate | null };

export default async function MaterialsPage() {
  const { supabase } = await getAuthContext();

  // RLS only returns materials for the participant's confirmed course dates.
  const { data } = await supabase
    .from("materials")
    .select("*, course_date:course_dates(*)")
    .order("created_at", { ascending: false });

  const rows = (data as Row[] | null) ?? [];

  return (
    <Container className="max-w-3xl">
      <h1 className="font-title text-4xl text-ink">Cursusmateriaal</h1>
      <p className="mt-2 text-muted">
        Bekijk hier de PDF&apos;s en slides bij jouw cursus. Het materiaal is
        alleen binnen deze omgeving te bekijken.
      </p>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-line bg-mist/40 p-10 text-center text-muted">
          Er is nog geen materiaal beschikbaar. Zodra je inschrijving bevestigd
          is, verschijnt het hier.
        </div>
      ) : (
        <ul className="mt-10 space-y-3">
          {rows.map((m) => (
            <li key={m.id}>
              <Link
                href={`/materiaal/${m.id}`}
                className="flex items-center justify-between rounded-xl border border-line bg-paper p-5 transition-shadow hover:shadow-[0_8px_30px_rgba(22,19,15,0.06)]"
              >
                <div>
                  <p className="font-medium text-ink">{m.title}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {m.mime_type === "application/pdf" ? "PDF" : "Afbeelding"}
                    {m.course_date
                      ? ` · ${m.course_date.title} (${capitalize(formatDate(m.course_date.starts_at))})`
                      : " · Algemeen"}
                  </p>
                </div>
                <span className="text-clay">Bekijken →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
