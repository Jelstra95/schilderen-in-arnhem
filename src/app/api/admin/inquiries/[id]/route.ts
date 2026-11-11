import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/admin-guard";
import { createAdminClient, missingAdminEnv } from "@/lib/supabase/admin";
import {
  EMAIL_RE,
  UUID_RE,
  parseDate,
  parseText,
} from "@/lib/admin-inquiries";
import type { CourseInquiry, InquiryStatus } from "@/lib/types";

// Without an account a person is a new or archived inquiry; "converted" is
// only reached through the account route. With an account they are signed up
// ("converted"), have taken part ("participated") or are archived.
const INQUIRY_STATUS: ReadonlySet<InquiryStatus> = new Set<InquiryStatus>([
  "new",
  "archived",
]);
const PARTICIPANT_STATUS: ReadonlySet<InquiryStatus> = new Set<InquiryStatus>([
  "converted",
  "participated",
  "archived",
]);

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Admin-only: edit any field of an inquiry. When the inquiry is linked to a
 * participant account, name, email and phone are kept in sync on the profile
 * (and the login email on the auth user), and the access period is stored on
 * the profile.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminApi();
  if (!guard.ok) return guard.response;

  const missingEnv = missingAdminEnv();
  if (missingEnv) {
    return bad(`Serverinstelling ${missingEnv} ontbreekt in deze omgeving.`, 503);
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) return bad("Ongeldige aanvraag.");

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Ongeldige aanvraag.");
  }

  const admin = createAdminClient();
  const { data: current, error: loadError } = await admin
    .from("course_inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle<CourseInquiry>();
  if (loadError) return bad("Laden van de aanvraag is mislukt.", 500);
  if (!current) return bad("Aanvraag niet gevonden.", 404);

  const inquiry: Record<string, string | boolean | null> = {};
  const profile: Record<string, string | null> = {};

  if (body.full_name !== undefined) {
    const name = parseText(body.full_name);
    if (name === false) return bad("Naam is te lang.");
    if (!name) return bad("Naam mag niet leeg zijn.");
    inquiry.full_name = name;
    profile.full_name = name;
  }

  if (body.email !== undefined) {
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return bad("Vul een geldig e-mailadres in.");
    inquiry.email = email;
    profile.email = email;
  }

  for (const key of ["phone", "day_preference", "notes", "admin_notes"] as const) {
    const value = parseText(body[key]);
    if (value === false) return bad("Een van de velden is te lang.");
    if (value !== undefined) inquiry[key] = value;
  }
  if (inquiry.phone !== undefined) profile.phone = inquiry.phone as string | null;

  if (body.responded !== undefined) {
    if (typeof body.responded !== "boolean") return bad("Ongeldige waarde.");
    inquiry.responded = body.responded;
  }

  if (body.status !== undefined) {
    const status = body.status as InquiryStatus;
    const allowed = current.user_id ? PARTICIPANT_STATUS : INQUIRY_STATUS;
    if (!allowed.has(status)) {
      return bad(
        current.user_id
          ? "Deze persoon heeft al een account. Kies aangemeld, deelgenomen of gearchiveerd."
          : "Maak eerst een account aan om iemand als deelnemer te markeren.",
      );
    }
    inquiry.status = status;
  }

  const startsOn = parseDate(body.access_starts_on);
  const endsOn = parseDate(body.access_ends_on);
  if (startsOn === false) return bad("Ongeldige startdatum.");
  if (endsOn === false) return bad("Ongeldige einddatum.");
  if (startsOn !== undefined || endsOn !== undefined) {
    if (!current.user_id) return bad("Maak eerst een account aan.");
    if (startsOn !== undefined) {
      if (!startsOn) return bad("Vul een startdatum in.");
      profile.access_starts_on = startsOn;
    }
    if (endsOn !== undefined) profile.access_ends_on = endsOn;
  }

  if (Object.keys(inquiry).length === 0 && Object.keys(profile).length === 0) {
    return bad("Niets om bij te werken.");
  }

  // Linked participant: update the login and the profile first, so a clash
  // (email already taken, end before start) leaves the inquiry unchanged.
  if (current.user_id && Object.keys(profile).length > 0) {
    if (profile.access_starts_on !== undefined || profile.access_ends_on !== undefined) {
      const { data: p } = await admin
        .from("profiles")
        .select("access_starts_on, access_ends_on")
        .eq("id", current.user_id)
        .maybeSingle();
      const start =
        profile.access_starts_on !== undefined
          ? profile.access_starts_on
          : (p?.access_starts_on ?? null);
      const end =
        profile.access_ends_on !== undefined
          ? profile.access_ends_on
          : (p?.access_ends_on ?? null);
      if (start && end && end < start) {
        return bad("De einddatum ligt vóór de startdatum.");
      }
    }

    if (profile.email && profile.email !== current.email.toLowerCase()) {
      const { error } = await admin.auth.admin.updateUserById(current.user_id, {
        email: profile.email,
        email_confirm: true,
      });
      if (error) {
        const taken = error.message.toLowerCase().includes("already");
        return bad(
          taken
            ? "Er bestaat al een account met dit e-mailadres."
            : "Wijzigen van het inlog e-mailadres is mislukt.",
          taken ? 409 : 500,
        );
      }
    }

    const { error } = await admin
      .from("profiles")
      .update(profile)
      .eq("id", current.user_id);
    if (error) return bad("Bijwerken van de deelnemer is mislukt.", 500);
  }

  if (Object.keys(inquiry).length > 0) {
    const { error } = await admin
      .from("course_inquiries")
      .update(inquiry)
      .eq("id", id);
    if (error) return bad("Bijwerken is mislukt.", 500);
  }

  return NextResponse.json({ ok: true });
}

/**
 * Admin-only: delete a person for good. If they have a participant account,
 * the login and profile are deleted too (enrollments keep their row but lose
 * the link). Admin accounts are never deleted this way.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminApi();
  if (!guard.ok) return guard.response;

  const missingEnv = missingAdminEnv();
  if (missingEnv) {
    return bad(`Serverinstelling ${missingEnv} ontbreekt in deze omgeving.`, 503);
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) return bad("Ongeldige aanvraag.");

  const admin = createAdminClient();
  const { data: current, error: loadError } = await admin
    .from("course_inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle<CourseInquiry>();
  if (loadError) return bad("Laden van de aanvraag is mislukt.", 500);
  if (!current) return bad("Aanvraag niet gevonden.", 404);

  if (current.user_id) {
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", current.user_id)
      .maybeSingle();
    if (profile?.role === "admin") {
      return bad("Dit is een beheerdersaccount en kan hier niet verwijderd worden.", 409);
    }
    if (profile) {
      const { error } = await admin.auth.admin.deleteUser(current.user_id);
      if (error) {
        console.error("[inquiries/delete] deleteUser failed", error.message);
        return bad("Verwijderen van het account is mislukt.", 500);
      }
    }
  }

  const { error } = await admin.from("course_inquiries").delete().eq("id", id);
  if (error) return bad("Verwijderen is mislukt.", 500);

  return NextResponse.json({ ok: true });
}
