import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, escapeHtml } from "@/lib/email";
import { capitalize, formatDate, formatTime } from "@/lib/format";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Body {
  course_date_id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
}

interface CourseDateRow {
  title: string;
  starts_at: string;
  location: string | null;
}

const ERROR_STATUS: Record<string, { status: number; message: string }> = {
  COURSE_DATE_NOT_FOUND: { status: 404, message: "Deze cursusdatum bestaat niet meer." },
  COURSE_DATE_CLOSED: { status: 409, message: "Inschrijven voor deze datum is gesloten." },
  NO_SPOTS_AVAILABLE: { status: 409, message: "Deze datum is helaas volgeboekt." },
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  const fullName = body.full_name?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.trim() || null;
  const courseDateId = body.course_date_id?.trim();

  if (!courseDateId) {
    return NextResponse.json({ error: "Kies een cursusdatum." }, { status: 400 });
  }
  if (!fullName || fullName.length < 2) {
    return NextResponse.json({ error: "Vul je naam in." }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Vul een geldig e-mailadres in." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reserve_spot", {
    p_course_date_id: courseDateId,
    p_full_name: fullName,
    p_email: email,
    p_phone: phone,
  });

  if (error) {
    const known = Object.keys(ERROR_STATUS).find((key) =>
      error.message.includes(key),
    );
    if (known) {
      const { status, message } = ERROR_STATUS[known];
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json(
      { error: "Er ging iets mis bij het inschrijven. Probeer het opnieuw." },
      { status: 500 },
    );
  }

  // Fire-and-forget notification emails. Same fail-safe pattern as /api/inquiries:
  // the booking is already in the DB; a failed send logs but does not fail the
  // response. We fetch the course date for human-readable email copy.
  const { data: courseDate } = await supabase
    .from("course_dates")
    .select("title, starts_at, location")
    .eq("id", courseDateId)
    .single<CourseDateRow>();

  const ownerEmail = process.env.OWNER_EMAIL;
  const results = await Promise.allSettled([
    ownerEmail
      ? sendEmail(
          enrollmentOwnerNotification(
            { fullName, email, phone, courseDate },
            ownerEmail,
          ),
        )
      : Promise.resolve({ ok: false, error: "OWNER_EMAIL not set" }),
    sendEmail(enrollmentUserConfirmation({ fullName, email, courseDate })),
  ]);

  for (const [idx, r] of results.entries()) {
    const label = idx === 0 ? "owner" : "user";
    if (r.status === "rejected") {
      console.error(`[enrollments] ${label} email threw:`, r.reason);
    } else if (!r.value.ok) {
      console.error(`[enrollments] ${label} email failed:`, r.value.error);
    }
  }

  return NextResponse.json({ id: data }, { status: 201 });
}

interface EnrollmentPayload {
  fullName: string;
  email: string;
  phone?: string | null;
  courseDate: CourseDateRow | null;
}

function describe(courseDate: CourseDateRow | null): string {
  if (!courseDate) return "een cursusdatum";
  const when = `${capitalize(formatDate(courseDate.starts_at))} · ${formatTime(courseDate.starts_at)}`;
  return `${courseDate.title} — ${when}`;
}

function enrollmentOwnerNotification(p: EnrollmentPayload, to: string) {
  const summary = describe(p.courseDate);
  const subject = `Nieuwe inschrijving — ${p.fullName}`;
  const text = [
    `Nieuwe inschrijving via de site:`,
    ``,
    `Naam: ${p.fullName}`,
    `E-mail: ${p.email}`,
    `Telefoon: ${p.phone ?? "-"}`,
    `Cursusdatum: ${summary}`,
    p.courseDate?.location ? `Locatie: ${p.courseDate.location}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const html = `
    <p>Nieuwe inschrijving via de site:</p>
    <ul>
      <li><strong>Naam:</strong> ${escapeHtml(p.fullName)}</li>
      <li><strong>E-mail:</strong> ${escapeHtml(p.email)}</li>
      <li><strong>Telefoon:</strong> ${escapeHtml(p.phone ?? "-")}</li>
      <li><strong>Cursusdatum:</strong> ${escapeHtml(summary)}</li>
      ${p.courseDate?.location ? `<li><strong>Locatie:</strong> ${escapeHtml(p.courseDate.location)}</li>` : ""}
    </ul>
  `;
  return { to, subject, text, html, replyTo: p.email };
}

function enrollmentUserConfirmation(
  p: Pick<EnrollmentPayload, "fullName" | "email" | "courseDate">,
) {
  const summary = describe(p.courseDate);
  const subject = "Je inschrijving is ontvangen";
  const text = [
    `Hoi ${p.fullName},`,
    ``,
    `Bedankt voor je inschrijving voor ${summary}.`,
    `Ik neem binnenkort persoonlijk contact met je op over de betaling en bevestiging.`,
    ``,
    `Groet,`,
    `Jelle van der Idder`,
    `info@jellevanderidder.com`,
  ].join("\n");
  const html = `
    <p>Hoi ${escapeHtml(p.fullName)},</p>
    <p>Bedankt voor je inschrijving voor <strong>${escapeHtml(summary)}</strong>.</p>
    <p>Ik neem binnenkort persoonlijk contact met je op over de betaling en
       bevestiging.</p>
    <p>Groet,<br>Jelle van der Idder<br>
       <a href="mailto:info@jellevanderidder.com">info@jellevanderidder.com</a></p>
  `;
  return { to: p.email, subject, text, html };
}
