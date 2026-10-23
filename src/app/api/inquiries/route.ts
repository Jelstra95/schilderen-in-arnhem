import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, missingAdminEnv } from "@/lib/supabase/admin";
import { sendEmail, escapeHtml } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_DAYS = new Set(["Dinsdagavond", "Woensdagavond"]);
const MAX_FIELD_LEN = 2000;

interface Body {
  full_name?: string;
  email?: string;
  phone?: string;
  day_preference?: string;
  notes?: string;
  // Honeypot: must be empty. Real users don't see this field; bots do.
  website?: string;
}

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  // Honeypot: suspicious submissions still get written to the DB so the owner
  // never has a silent-drop blind spot, but they're pre-archived so they don't
  // clutter the "new" inbox. If a real user ever trips this (bad password
  // manager etc.), the row is still visible in /admin/aanvragen.
  const suspicious = Boolean(body.website && body.website.trim().length > 0);

  const fullName = body.full_name?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.trim() || null;
  const dayPreference = body.day_preference?.trim();
  const notes = body.notes?.trim() || null;

  if (!fullName || fullName.length < 2 || fullName.length > MAX_FIELD_LEN) {
    return NextResponse.json({ error: "Vul je naam in." }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email) || email.length > MAX_FIELD_LEN) {
    return NextResponse.json(
      { error: "Vul een geldig e-mailadres in." },
      { status: 400 },
    );
  }
  if (!dayPreference || !ALLOWED_DAYS.has(dayPreference)) {
    return NextResponse.json(
      { error: "Kies een voorkeursavond." },
      { status: 400 },
    );
  }
  if (phone && phone.length > MAX_FIELD_LEN) {
    return NextResponse.json({ error: "Telefoonnummer is te lang." }, { status: 400 });
  }
  if (notes && notes.length > MAX_FIELD_LEN) {
    return NextResponse.json({ error: "Opmerkingen zijn te lang." }, { status: 400 });
  }

  const missing = missingAdminEnv();
  if (missing) {
    console.error(`[inquiries] missing env: ${missing}`);
    return NextResponse.json(
      {
        error:
          "Het formulier is tijdelijk niet beschikbaar. Neem direct contact op via info@jellevanderidder.com.",
      },
      { status: 503 },
    );
  }

  const admin = createAdminClient();

  // DURABLE WRITE FIRST. If this fails the submission is lost — surface a 500
  // and the client shows a visible error, no silent data loss.
  const { data: inserted, error: insertError } = await admin
    .from("course_inquiries")
    .insert({
      full_name: fullName,
      email,
      phone,
      day_preference: dayPreference,
      notes,
      status: suspicious ? "archived" : "new",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("[inquiries] insert failed:", insertError);
    return NextResponse.json(
      {
        error:
          "Er ging iets mis bij het versturen van je aanmelding. Probeer het opnieuw of mail naar info@jellevanderidder.com.",
      },
      { status: 500 },
    );
  }

  // Fire owner + user emails for real submissions. Honeypot hits land in the
  // DB (archived) but don't trigger emails — otherwise bots would spam the
  // owner's inbox. Email failures are best-effort: a failure logs but does
  // NOT fail the request, because the submission is already safely in the DB.
  if (!suspicious) {
    const ownerEmail = process.env.OWNER_EMAIL;
    const results = await Promise.allSettled([
      ownerEmail
        ? sendEmail(ownerNotification({ fullName, email, phone, dayPreference, notes }, ownerEmail))
        : Promise.resolve({ ok: false, error: "OWNER_EMAIL not set" }),
      sendEmail(userConfirmation({ fullName, email, dayPreference })),
    ]);

    for (const [idx, r] of results.entries()) {
      const label = idx === 0 ? "owner" : "user";
      if (r.status === "rejected") {
        console.error(`[inquiries] ${label} email threw:`, r.reason);
      } else if (!r.value.ok) {
        console.error(`[inquiries] ${label} email failed:`, r.value.error);
      }
    }
  }

  return NextResponse.json({ id: inserted.id }, { status: 201 });
}

interface InquiryPayload {
  fullName: string;
  email: string;
  phone: string | null;
  dayPreference: string;
  notes: string | null;
}

function ownerNotification(p: InquiryPayload, to: string) {
  const subject = `Nieuwe aanmelding — ${p.fullName} (${p.dayPreference})`;
  const lines = [
    `Nieuwe aanmelding via de site:`,
    ``,
    `Naam: ${p.fullName}`,
    `E-mail: ${p.email}`,
    `Telefoon: ${p.phone ?? "-"}`,
    `Voorkeursavond: ${p.dayPreference}`,
    ``,
    `Opmerkingen:`,
    p.notes ?? "-",
  ];
  const text = lines.join("\n");
  const html = `
    <p>Nieuwe aanmelding via de site:</p>
    <ul>
      <li><strong>Naam:</strong> ${escapeHtml(p.fullName)}</li>
      <li><strong>E-mail:</strong> ${escapeHtml(p.email)}</li>
      <li><strong>Telefoon:</strong> ${escapeHtml(p.phone ?? "-")}</li>
      <li><strong>Voorkeursavond:</strong> ${escapeHtml(p.dayPreference)}</li>
    </ul>
    <p><strong>Opmerkingen:</strong><br>${escapeHtml(p.notes ?? "-").replace(/\n/g, "<br>")}</p>
  `;
  return { to, subject, text, html, replyTo: p.email };
}

function userConfirmation(p: Pick<InquiryPayload, "fullName" | "email" | "dayPreference">) {
  const subject = "We hebben je aanmelding ontvangen";
  const text = [
    `Hoi ${p.fullName},`,
    ``,
    `Bedankt voor je aanmelding voor de schildercursus (voorkeursavond: ${p.dayPreference}).`,
    `Ik neem binnenkort persoonlijk contact met je op over de startdatum, betaling en bevestiging.`,
    ``,
    `Groet,`,
    `Jelle van der Idder`,
    `info@jellevanderidder.com`,
  ].join("\n");
  const html = `
    <p>Hoi ${escapeHtml(p.fullName)},</p>
    <p>Bedankt voor je aanmelding voor de schildercursus (voorkeursavond:
       <strong>${escapeHtml(p.dayPreference)}</strong>).</p>
    <p>Ik neem binnenkort persoonlijk contact met je op over de startdatum,
       betaling en bevestiging.</p>
    <p>Groet,<br>Jelle van der Idder<br>
       <a href="mailto:info@jellevanderidder.com">info@jellevanderidder.com</a></p>
  `;
  return { to: p.email, subject, text, html };
}
