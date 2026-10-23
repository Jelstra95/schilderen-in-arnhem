import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { InquiriesManager } from "@/components/admin/InquiriesManager";
import { createAdminClient, missingAdminEnv } from "@/lib/supabase/admin";
import type { CourseInquiry } from "@/lib/types";

export const metadata: Metadata = { title: "Aanvragen" };

export default async function AdminInquiriesPage() {
  const missingEnv = missingAdminEnv();
  if (missingEnv) {
    return (
      <Container className="max-w-5xl">
        <h1 className="font-title text-4xl text-ink">Aanvragen</h1>
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-title text-lg text-amber-900">
            Aanvragen zijn niet beschikbaar
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
  const { data, error } = await admin
    .from("course_inquiries")
    .select("*")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  // Surface query errors loudly. Falling back to an empty list would be a
  // silent-failure trap: the owner would see "no inquiries" and assume all is
  // well when in reality the DB wasn't reachable.
  if (error) {
    return (
      <Container className="max-w-5xl">
        <h1 className="font-title text-4xl text-ink">Aanvragen</h1>
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="font-title text-lg text-red-900">
            Aanvragen konden niet geladen worden
          </p>
          <p className="mt-2 text-sm text-red-800">
            De database gaf een fout: <code className="font-mono">{error.message}</code>.
            Herlaad de pagina. Als de fout blijft, is er een probleem met
            Supabase of met deze deploy.
          </p>
        </div>
      </Container>
    );
  }

  const rows = (data as CourseInquiry[] | null) ?? [];

  return (
    <Container className="max-w-5xl">
      <h1 className="font-title text-4xl text-ink">Aanvragen</h1>
      <p className="mt-2 text-muted">
        Aanmeldingen via het formulier op <code className="font-mono">/inschrijven</code>.
        Elke aanvraag wordt direct opgeslagen; je krijgt daarnaast een e-mail,
        maar deze lijst is de bron van waarheid.
      </p>
      <div className="mt-10">
        <InquiriesManager rows={rows} />
      </div>
    </Container>
  );
}
