import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/admin-guard";
import { createAdminClient, MATERIALS_BUCKET } from "@/lib/supabase/admin";

/**
 * Updates the metadata (title, taught-on date, linked course date) of an
 * existing material. The stored file itself is never changed here.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminApi();
  if (!guard.ok) return guard.response;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Titel is verplicht." }, { status: 400 });
  }

  // taught_on: YYYY-MM-DD, or null to clear it.
  let taughtOn: string | null = null;
  if (body.taught_on) {
    const raw = String(body.taught_on).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(Date.parse(raw))) {
      return NextResponse.json({ error: "Ongeldige datum." }, { status: 400 });
    }
    taughtOn = raw;
  }

  const courseDateId = body.course_date_id ? String(body.course_date_id) : null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("materials")
    .update({ title, taught_on: taughtOn, course_date_id: courseDateId })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Opslaan mislukt." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminApi();
  if (!guard.ok) return guard.response;
  const { id } = await params;

  const admin = createAdminClient();

  const { data: material } = await admin
    .from("materials")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (!material) {
    return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
  }

  await admin.storage.from(MATERIALS_BUCKET).remove([material.storage_path]);
  const { error } = await admin.from("materials").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Verwijderen mislukt." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
