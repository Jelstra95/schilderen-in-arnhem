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

/**
 * Step 2 of the direct-to-storage upload: the browser has already uploaded the
 * file to Supabase Storage via a signed URL (see ./upload-url), so this only
 * verifies the object exists and records the `materials` row. No file body
 * passes through this function.
 */
export async function POST(request: NextRequest) {
  const guard = await guardAdminApi();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const path = body?.path?.toString();
  const title = body?.title?.toString().trim();
  const mimeType = body?.mimeType?.toString() || "";
  const courseDateId = body?.courseDateId ? String(body.courseDateId) : null;
  const taughtOnRaw = body?.taughtOn?.toString().trim() || null;
  const thumbnailBase64 =
    typeof body?.thumbnailBase64 === "string" ? body.thumbnailBase64 : null;

  if (!path || !title) {
    return NextResponse.json({ error: "Onvolledige gegevens." }, { status: 400 });
  }
  if (!ALLOWED.has(mimeType)) {
    return NextResponse.json({ error: "Type niet toegestaan." }, { status: 400 });
  }

  // `taught_on` comes from an <input type="date"> as YYYY-MM-DD. Validate the
  // shape and that it is a real calendar date before storing it.
  let taughtOn: string | null = null;
  if (taughtOnRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(taughtOnRaw) || Number.isNaN(Date.parse(taughtOnRaw))) {
      return NextResponse.json({ error: "Ongeldige datum." }, { status: 400 });
    }
    taughtOn = taughtOnRaw;
  }

  // The path must live in the folder implied by the (optional) course date.
  const folder = courseDateId ?? "algemeen";
  if (!path.startsWith(`${folder}/`)) {
    return NextResponse.json({ error: "Ongeldig pad." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify the uploaded object exists and read its real size.
  const name = path.slice(folder.length + 1);
  const { data: list } = await admin.storage
    .from(MATERIALS_BUCKET)
    .list(folder, { search: name, limit: 100 });
  const object = list?.find((o) => o.name === name);

  if (!object) {
    return NextResponse.json(
      { error: "De upload is niet gevonden." },
      { status: 400 },
    );
  }

  const size =
    typeof object.metadata?.size === "number" ? object.metadata.size : null;
  if (size != null && size > MAX_BYTES) {
    await admin.storage.from(MATERIALS_BUCKET).remove([path]);
    return NextResponse.json(
      { error: "Bestand is te groot (max. 50 MB)." },
      { status: 400 },
    );
  }

  // Store the preview image (best-effort; a failure just means no thumbnail).
  let thumbnailPath: string | null = null;
  if (thumbnailBase64) {
    try {
      const bytes = Buffer.from(thumbnailBase64, "base64");
      if (bytes.length > 0 && bytes.length < 2 * 1024 * 1024) {
        const tp = `${folder}/thumb-${crypto.randomUUID()}.jpg`;
        const { error: thumbErr } = await admin.storage
          .from(MATERIALS_BUCKET)
          .upload(tp, bytes, { contentType: "image/jpeg", upsert: false });
        if (!thumbErr) thumbnailPath = tp;
      }
    } catch {
      // ignore — thumbnail is optional
    }
  }

  const { data, error: insertError } = await admin
    .from("materials")
    .insert({
      course_date_id: courseDateId,
      title,
      taught_on: taughtOn,
      storage_path: path,
      thumbnail_path: thumbnailPath,
      mime_type: mimeType,
      size_bytes: size,
    })
    .select("*")
    .single();

  if (insertError) {
    // Roll back the uploaded objects so we don't leave orphans.
    const orphans = thumbnailPath ? [path, thumbnailPath] : [path];
    await admin.storage.from(MATERIALS_BUCKET).remove(orphans);
    return NextResponse.json(
      { error: "Opslaan van het materiaal is mislukt." },
      { status: 500 },
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
