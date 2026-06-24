import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/admin-guard";
import { createAdminClient, MATERIALS_BUCKET } from "@/lib/supabase/admin";

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
