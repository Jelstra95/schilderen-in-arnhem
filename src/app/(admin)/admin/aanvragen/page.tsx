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
  const { data } = await admin
    .from("course_inquiries")
    .select("*")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

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
