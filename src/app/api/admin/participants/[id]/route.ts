import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined; // field absent → leave unchanged
  if (value === null || value === "") return null; // explicitly cleared
  const s = String(value).trim();
  if (!DATE_RE.test(s) || Number.isNaN(Date.parse(s))) return undefined;
  return s;
}

/**
 * Admin-only: update a participant's membership window (and contact details).
 * Used to change start/end dates and to end a participant's access.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminApi();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Ongeldige deelnemer." }, { status: 400 });
  }

  let body: {
    full_name?: string;
    phone?: string | null;
    access_starts_on?: string | null;
    access_ends_on?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  const update: Record<string, string | null> = {};

  if (body.full_name !== undefined) {
    const name = body.full_name.trim();
    if (!name) {
      return NextResponse.json({ error: "Naam mag niet leeg zijn." }, { status: 400 });
    }
    update.full_name = name;
  }
  if (body.phone !== undefined) {
    update.phone = body.phone?.trim() || null;
  }

  const startsOn = parseDate(body.access_starts_on);
  const endsOn = parseDate(body.access_ends_on);
  if (startsOn === undefined && body.access_starts_on !== undefined) {
    return NextResponse.json({ error: "Ongeldige startdatum." }, { status: 400 });
  }
  if (endsOn === undefined && body.access_ends_on !== undefined) {
    return NextResponse.json({ error: "Ongeldige einddatum." }, { status: 400 });
  }
  if (body.access_starts_on !== undefined) update.access_starts_on = startsOn ?? null;
  if (body.access_ends_on !== undefined) update.access_ends_on = endsOn ?? null;

  // Guard against an end date before the (effective) start date.
  const effStart =
    update.access_starts_on !== undefined ? update.access_starts_on : undefined;
  if (
    update.access_ends_on &&
    effStart !== undefined &&
    effStart !== null &&
    update.access_ends_on < effStart
  ) {
    return NextResponse.json(
      { error: "De einddatum ligt vóór de startdatum." },
      { status: 400 },
    );
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Niets om bij te werken." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update(update)
    .eq("id", id)
    .eq("role", "participant")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: "Bijwerken van de deelnemer is mislukt." },
      { status: error ? 500 : 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
