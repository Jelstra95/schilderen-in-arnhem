import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { MaterialTile } from "@/components/MaterialTile";
import { getViewerContext, materialsOrFilter } from "@/lib/preview";
import { capitalize, formatDay } from "@/lib/format";
import type { CourseDate, Material } from "@/lib/types";

export const metadata: Metadata = { title: "Cursusmateriaal" };

type Row = Material & { course_date: CourseDate | null };

export default async function MaterialsPage() {
  const { isPreview, viewer, db } = await getViewerContext();

  // For a real participant, RLS returns only materials within their access
  // window. In preview, the service-role client bypasses RLS, so we replicate
  // that window filter for the previewed student.
  let query = db.from("materials").select("*, course_date:course_dates(*)");
  if (isPreview && viewer) query = query.or(materialsOrFilter(viewer));

  // Sorted by lesson date (chronological); undated "general" material last.
  const { data } = await query
    .order("taught_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const rows = (data as Row[] | null) ?? [];

  return (
    <Container className="max-w-4xl">
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
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {rows.map((m) => (
            <MaterialTile
              key={m.id}
              id={m.id}
              title={m.title}
              subtitle={
                m.taught_on ? capitalize(formatDay(m.taught_on)) : undefined
              }
              isPdf={m.mime_type === "application/pdf"}
              hasThumbnail={m.thumbnail_path != null}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
