import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createAdminClient, MATERIALS_BUCKET } from "@/lib/supabase/admin";

/**
 * Streams a material's lightweight preview image (rendered from the PDF's second
 * slide on upload). Same RLS gate as the main stream, but serves a small image
 * so student tiles don't have to fetch and render the whole slide deck.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await getAuthContext();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  // RLS gate: returns the row only if the caller may view the material.
  const { data: material } = await supabase
    .from("materials")
    .select("thumbnail_path")
    .eq("id", id)
    .maybeSingle();

  if (!material?.thumbnail_path) {
    return NextResponse.json({ error: "Geen voorbeeld." }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from(MATERIALS_BUCKET)
    .createSignedUrl(material.thumbnail_path, 300);

  if (signError || !signed) {
    return NextResponse.json(
      { error: "Voorbeeld niet beschikbaar." },
      { status: 500 },
    );
  }

  const upstream = await fetch(signed.signedUrl);
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Voorbeeld niet beschikbaar." },
      { status: 502 },
    );
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    material.thumbnail_path.endsWith(".png") ? "image/png" : "image/jpeg",
  );
  headers.set("Cache-Control", "private, max-age=3600");
  headers.set("X-Content-Type-Options", "nosniff");

  return new Response(upstream.body, { status: 200, headers });
}
