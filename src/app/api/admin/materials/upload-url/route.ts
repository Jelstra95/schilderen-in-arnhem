import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/admin-guard";
import { createAdminClient, MATERIALS_BUCKET } from "@/lib/supabase/admin";

const ALLOWED = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * Step 1 of the direct-to-storage upload. The admin form calls this to get a
 * short-lived signed upload URL; the browser then PUTs the (already compressed)
 * file straight to Supabase Storage, so the large body never passes through
 * this serverless function. The server owns the object path.
 */
export async function POST(request: NextRequest) {
  const guard = await guardAdminApi();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const title = body?.title?.toString().trim();
  const filename = body?.filename?.toString() || "bestand";
  const mimeType = body?.mimeType?.toString() || "";
  const courseDateId = body?.courseDateId ? String(body.courseDateId) : null;

  if (!title) {
    return NextResponse.json({ error: "Titel is verplicht." }, { status: 400 });
  }
  if (!ALLOWED.has(mimeType)) {
    return NextResponse.json(
      { error: "Alleen PDF of afbeeldingen (PNG, JPG, WebP) zijn toegestaan." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const folder = courseDateId ?? "algemeen";
  const path = `${folder}/${crypto.randomUUID()}-${slug(filename)}`;

  const { data, error } = await admin.storage
    .from(MATERIALS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json(
      { error: "Kon de upload niet voorbereiden." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    bucket: MATERIALS_BUCKET,
    path: data.path,
    token: data.token,
  });
}
