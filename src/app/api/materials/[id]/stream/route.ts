import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createAdminClient, MATERIALS_BUCKET } from "@/lib/supabase/admin";

/**
 * Streams a course material inline after server-side authorization.
 *
 * Access control: the material row is read with the *user's* session client, so
 * RLS only returns it for an admin or a confirmed participant of the relevant
 * course date. The file itself is then fetched server-side via a short-lived
 * signed URL (never exposed to the browser) and proxied back with
 * `Content-Disposition: inline` and Range support — no download link is ever
 * handed to the client.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await getAuthContext();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  // RLS gate: returns the row only if the caller may view it.
  const { data: material } = await supabase
    .from("materials")
    .select("storage_path, mime_type")
    .eq("id", id)
    .maybeSingle();

  if (!material) {
    return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from(MATERIALS_BUCKET)
    .createSignedUrl(material.storage_path, 60);

  if (signError || !signed) {
    return NextResponse.json(
      { error: "Bestand niet beschikbaar." },
      { status: 500 },
    );
  }

  const range = request.headers.get("range");
  const upstream = await fetch(signed.signedUrl, {
    headers: range ? { Range: range } : {},
  });

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json(
      { error: "Bestand niet beschikbaar." },
      { status: 502 },
    );
  }

  const headers = new Headers();
  headers.set("Content-Type", material.mime_type);
  headers.set("Content-Disposition", "inline");
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Accept-Ranges", "bytes");

  for (const h of ["content-length", "content-range"]) {
    const value = upstream.headers.get(h);
    if (value) headers.set(h, value);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
