import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/admin-guard";
import { createAdminClient, missingAdminEnv } from "@/lib/supabase/admin";
import {
  DEFAULT_PASSWORD,
  EMAIL_RE,
  UUID_RE,
  todayISO,
} from "@/lib/admin-inquiries";
import type { CourseInquiry } from "@/lib/types";

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Admin-only: turn an inquiry into a participant. Creates an account for the
 * inquiry's email address with the default password, starts access today and
 * marks the inquiry as converted. If an account with that email already exists
 * and is not linked to another inquiry, it is linked instead.
 */
export async function POST(
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
  const { data: inquiry, error: loadError } = await admin
    .from("course_inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle<CourseInquiry>();
  if (loadError) return bad("Laden van de aanvraag is mislukt.", 500);
  if (!inquiry) return bad("Aanvraag niet gevonden.", 404);
  if (inquiry.user_id) return bad("Deze persoon heeft al een account.", 409);

  const email = inquiry.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return bad("Het e-mailadres van deze aanvraag is ongeldig. Pas het eerst aan.");
  }

  let userId: string;
  let password: string | null = DEFAULT_PASSWORD;
  let createdNow = false;

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: inquiry.full_name },
    });

  if (created?.user) {
    userId = created.user.id;
    createdNow = true;
  } else {
    // Most likely the account already exists: link to it if it is free.
    const { data: existing } = await admin
      .from("profiles")
      .select("id, role")
      .ilike("email", email)
      .maybeSingle();
    if (!existing) {
      console.error("[inquiries/account] createUser failed", createError?.message);
      return bad("Aanmaken van het account is mislukt.", 500);
    }
    if (existing.role !== "participant") {
      return bad("Dit e-mailadres hoort bij een beheerdersaccount.", 409);
    }
    const { data: other } = await admin
      .from("course_inquiries")
      .select("full_name")
      .eq("user_id", existing.id)
      .maybeSingle();
    if (other) {
      return bad(
        `Dit e-mailadres hoort al bij deelnemer ${other.full_name}. Archiveer een van beide aanvragen.`,
        409,
      );
    }
    userId = existing.id;
    password = null; // the existing account keeps its own password
  }

  // The on_auth_user_created trigger made the profile row; fill it in. An
  // existing account keeps its access period if it already has one.
  const { data: profile } = await admin
    .from("profiles")
    .select("access_starts_on")
    .eq("id", userId)
    .maybeSingle();

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      role: "participant",
      full_name: inquiry.full_name,
      phone: inquiry.phone,
      ...(profile?.access_starts_on ? {} : { access_starts_on: todayISO() }),
    })
    .eq("id", userId);

  const { error: linkError } = profileError
    ? { error: profileError }
    : await admin
        .from("course_inquiries")
        .update({ user_id: userId, status: "converted" })
        .eq("id", id);

  if (profileError || linkError) {
    // Roll back a freshly created login so a retry starts clean.
    if (createdNow) await admin.auth.admin.deleteUser(userId);
    return bad("Opslaan van de deelnemer is mislukt.", 500);
  }

  return NextResponse.json({ ok: true, email, password }, { status: 201 });
}
