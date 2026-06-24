import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/admin-guard";
import { createAdminClient, MATERIALS_BUCKET } from "@/lib/supabase/admin";

const ALLOWED = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminApi();
  if (!guard.ok) return guard.response;

  const form = await request.formData();
  const file = form.get("file");
  const title = form.get("title")?.toString().trim();
  const courseDateId = form.get("course_date_id")?.toString() || null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Geen bestand ontvangen." }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Titel is verplicht." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Alleen PDF of afbeeldingen (PNG, JPG, WebP) zijn toegestaan." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Bestand is te groot (max. 50 MB)." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const folder = courseDateId ?? "algemeen";
  const path = `${folder}/${crypto.randomUUID()}-${slug(file.name)}`;

  const { error: uploadError } = await admin.storage
    .from(MATERIALS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json(
      { error: "Uploaden naar opslag is mislukt." },
      { status: 500 },
    );
  }

  const { data, error: insertError } = await admin
    .from("materials")
    .insert({
      course_date_id: courseDateId,
      title,
      storage_path: path,
      mime_type: file.type,
      size_bytes: file.size,
    })
    .select("*")
    .single();

  if (insertError) {
    // Roll back the uploaded object so we don't leave orphans.
    await admin.storage.from(MATERIALS_BUCKET).remove([path]);
    return NextResponse.json(
      { error: "Opslaan van het materiaal is mislukt." },
      { status: 500 },
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
