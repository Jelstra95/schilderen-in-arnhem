import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Body {
  course_date_id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
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

  return NextResponse.json({ id: data }, { status: 201 });
}
