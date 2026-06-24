import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/admin-guard";

interface Body {
  title?: string;
  description?: string;
  starts_at?: string;
  ends_at?: string;
  location?: string;
  capacity?: number;
  status?: "open" | "closed";
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminApi();
  if (!guard.ok) return guard.response;

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Titel is verplicht." }, { status: 400 });
  }
  if (!body.starts_at) {
    return NextResponse.json(
      { error: "Datum en tijd zijn verplicht." },
      { status: 400 },
    );
  }
  const capacity = Number(body.capacity);
  if (!Number.isFinite(capacity) || capacity < 0) {
    return NextResponse.json(
      { error: "Aantal plekken is ongeldig." },
      { status: 400 },
    );
  }

  const { data, error } = await guard.ctx.supabase
    .from("course_dates")
    .insert({
      title,
      description: body.description?.trim() || null,
      starts_at: body.starts_at,
      ends_at: body.ends_at || null,
      location: body.location?.trim() || null,
      capacity,
      status: body.status === "closed" ? "closed" : "open",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Opslaan mislukt." }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 201 });
}
