import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enrollment } from "@/lib/types";

/** Generates a readable temporary password for the new participant account. */
function tempPassword(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

/**
 * Creates (or links) a participant account for a paid enrollment, then confirms
 * the enrollment. Kept fully in admin hands — runs only after payment.
 * Returns a temporary password for the admin to share with the participant.
 */
export async function POST(request: NextRequest) {
  const guard = await guardAdminApi();
  if (!guard.ok) return guard.response;

  let body: { enrollment_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }
  if (!body.enrollment_id) {
    return NextResponse.json(
      { error: "Inschrijving ontbreekt." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Load the enrollment (service role).
  const { data: enrollment, error: loadError } = await admin
    .from("enrollments")
    .select("*")
    .eq("id", body.enrollment_id)
    .single<Enrollment>();

  if (loadError || !enrollment) {
    return NextResponse.json(
      { error: "Inschrijving niet gevonden." },
      { status: 404 },
    );
  }

  const email = enrollment.email.toLowerCase();
  let userId = enrollment.user_id;
  let password: string | null = null;

  if (!userId) {
    // Create a fresh auth user (email pre-confirmed — no SMTP needed yet).
    password = tempPassword();
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: enrollment.full_name },
      });

    if (createError) {
      // Account may already exist — link to it instead.
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (!existing) {
        return NextResponse.json(
          { error: "Aanmaken van het account is mislukt." },
          { status: 500 },
        );
      }
      userId = existing.id;
      password = null; // existing account keeps its own password
    } else {
      userId = created.user.id;
    }
  }

  // Ensure the profile carries the participant's name (trigger created the row).
  await admin
    .from("profiles")
    .update({ full_name: enrollment.full_name, role: "participant" })
    .eq("id", userId);

  // Link + confirm the enrollment.
  const { error: linkError } = await admin
    .from("enrollments")
    .update({ user_id: userId, status: "confirmed" })
    .eq("id", enrollment.id);

  if (linkError) {
    return NextResponse.json(
      { error: "Koppelen van de inschrijving is mislukt." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, email, password });
}
