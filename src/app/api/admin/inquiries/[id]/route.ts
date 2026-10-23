import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/admin-guard";
import { createAdminClient, missingAdminEnv } from "@/lib/supabase/admin";
import type { InquiryStatus } from "@/lib/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_STATUS: ReadonlySet<InquiryStatus> = new Set<InquiryStatus>([
  "new",
  "contacted",
  "converted",
  "archived",
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminApi();
  if (!guard.ok) return guard.response;

  const missingEnv = missingAdminEnv();
  if (missingEnv) {
    return NextResponse.json(
      { error: `Serverinstelling ${missingEnv} ontbreekt in deze omgeving.` },
      { status: 503 },
    );
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  const status = body.status as InquiryStatus | undefined;
  if (!status || !ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ error: "Ongeldige status." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("course_inquiries")
    .update({ status })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: "Bijwerken is mislukt." },
      { status: error ? 500 : 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
