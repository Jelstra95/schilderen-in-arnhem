import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/admin-guard";
import { createAdminClient, missingAdminEnv } from "@/lib/supabase/admin";
import { EMAIL_RE, parseText } from "@/lib/admin-inquiries";

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Admin-only: add a person to the list by hand (someone who signed up by phone
 * or in person). They can then get an account like any other inquiry.
 */
export async function POST(request: NextRequest) {
  const guard = await guardAdminApi();
  if (!guard.ok) return guard.response;

  const missingEnv = missingAdminEnv();
  if (missingEnv) {
    return bad(`Serverinstelling ${missingEnv} ontbreekt in deze omgeving.`, 503);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Ongeldige aanvraag.");
  }

  const fullName = parseText(body.full_name);
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = parseText(body.phone);
  const day = parseText(body.day_preference);
  const adminNotes = parseText(body.admin_notes);

  if (!fullName) return bad("Naam is verplicht.");
  if (!EMAIL_RE.test(email)) return bad("Vul een geldig e-mailadres in.");
  if (phone === false || day === false || adminNotes === false) {
    return bad("Een van de velden is te lang.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("course_inquiries")
    .insert({
      full_name: fullName,
      email,
      phone: phone ?? null,
      day_preference: day ?? null,
      admin_notes: adminNotes ?? null,
      status: "new",
      responded: true,
    })
    .select("id")
    .single();

  if (error || !data) return bad("Toevoegen is mislukt.", 500);
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
