import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/admin-guard";
import { createAdminClient, missingAdminEnv } from "@/lib/supabase/admin";

/** The default password every new participant account is created with. */
const DEFAULT_PASSWORD = "olieverf";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseDate(value: unknown): string | null | undefined {
  // undefined = field absent, null = explicitly cleared, string = a date.
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const s = String(value).trim();
  if (!DATE_RE.test(s) || Number.isNaN(Date.parse(s))) return undefined;
  return s;
}

/**
 * Admin-only: directly create a participant account (no site enrollment).
 * Sets the fixed default password so the admin can pass it on, and stores the
 * membership period that gates which course material the participant sees.
 */
export async function POST(request: NextRequest) {
  const guard = await guardAdminApi();
  if (!guard.ok) return guard.response;

  const missingEnv = missingAdminEnv();
  if (missingEnv) {
    return NextResponse.json(
      { error: `Serverinstelling ${missingEnv} ontbreekt in deze omgeving.` },
      { status: 503 },
    );
  }

  let body: {
    email?: string;
    full_name?: string;
    phone?: string;
    access_starts_on?: string;
    access_ends_on?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const fullName = body.full_name?.trim() ?? "";
  const phone = body.phone?.trim() || null;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Vul een geldig e-mailadres in." },
      { status: 400 },
    );
  }
  if (!fullName) {
    return NextResponse.json({ error: "Naam is verplicht." }, { status: 400 });
  }

  const startsOn = parseDate(body.access_starts_on);
  const endsOn = parseDate(body.access_ends_on);
  if (startsOn === undefined || !startsOn) {
    return NextResponse.json(
      { error: "Vul een geldige startdatum in." },
      { status: 400 },
    );
  }
  if (endsOn === undefined) {
    return NextResponse.json({ error: "Ongeldige einddatum." }, { status: 400 });
  }
  if (endsOn && endsOn < startsOn) {
    return NextResponse.json(
      { error: "De einddatum ligt vóór de startdatum." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Create the auth user. Email is pre-confirmed so no verification mail is
  // sent — the admin notifies the participant themselves.
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (createError || !created?.user) {
    const already = createError?.message?.toLowerCase().includes("already");
    return NextResponse.json(
      {
        error: already
          ? "Er bestaat al een account met dit e-mailadres."
          : "Aanmaken van het account is mislukt.",
      },
      { status: already ? 409 : 500 },
    );
  }

  // The on_auth_user_created trigger already inserted the profile row; fill in
  // the participant details + membership window.
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      role: "participant",
      full_name: fullName,
      phone,
      access_starts_on: startsOn,
      access_ends_on: endsOn,
    })
    .eq("id", created.user.id);

  if (profileError) {
    // Roll back the half-created account so a retry starts clean.
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: "Opslaan van de deelnemergegevens is mislukt." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ok: true, email, password: DEFAULT_PASSWORD },
    { status: 201 },
  );
}
