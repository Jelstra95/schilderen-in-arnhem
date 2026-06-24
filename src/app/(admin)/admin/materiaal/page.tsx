import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import {
  MaterialManager,
  type MaterialRow,
} from "@/components/admin/MaterialManager";
import { getAuthContext } from "@/lib/auth";
import type { CourseDate } from "@/lib/types";

export const metadata: Metadata = { title: "Materiaal" };

export default async function AdminMaterialsPage() {
  const { supabase } = await getAuthContext();

  const [materialsRes, datesRes] = await Promise.all([
    supabase
      .from("materials")
      .select("*, course_date:course_dates(*)")
      .order("created_at", { ascending: false }),
    supabase
      .from("course_dates")
      .select("*")
      .order("starts_at", { ascending: false }),
  ]);

  return (
    <Container className="max-w-4xl">
      <h1 className="font-title text-4xl text-ink">Cursusmateriaal</h1>
      <p className="mt-2 text-muted">
        Upload PDF&apos;s en slides. Materiaal is alleen zichtbaar voor
        bevestigde deelnemers binnen de app — er zijn geen downloadlinks.
      </p>
      <div className="mt-10">
        <MaterialManager
          materials={(materialsRes.data as MaterialRow[] | null) ?? []}
          courseDates={(datesRes.data as CourseDate[] | null) ?? []}
        />
      </div>
    </Container>
  );
}
