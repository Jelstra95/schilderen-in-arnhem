import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { PREVIEW_COOKIE } from "@/lib/preview";

/**
 * Starts previewing the participant area as a specific student. Admin-only.
 * Stores the target participant id in an httpOnly cookie; the participant pages
 * read it via getViewerContext() to scope their data.
 */
export async function POST(request: NextRequest) {
  const guard = await guardAdminApi();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const participantId = body?.participant_id ? String(body.participant_id) : "";
  if (!participantId) {
    return NextResponse.json({ error: "Geen deelnemer opgegeven." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", participantId)
    .maybeSingle();

  if (!target || target.role !== "participant") {
    return NextResponse.json({ error: "Deelnemer niet gevonden." }, { status: 404 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PREVIEW_COOKIE, participantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });
  return res;
}

/** Stops previewing and returns to normal admin viewing. */
export async function DELETE() {
  const guard = await guardAdminApi();
  if (!guard.ok) return guard.response;

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(PREVIEW_COOKIE);
  return res;
}
