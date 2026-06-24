import { NextResponse, type NextRequest } from "next/server";
import { guardAdminApi } from "@/lib/admin-guard";

interface Body {
  title?: string;
  description?: string | null;
  starts_at?: string;
  ends_at?: string | null;
  location?: string | null;
  capacity?: number;
  status?: "open" | "closed";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminApi();
  if (!guard.ok) return guard.response;
  const { id } = await params;

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.title !== undefined) update.title = body.title.trim();
  if (body.description !== undefined)
    update.description = body.description?.toString().trim() || null;
  if (body.starts_at !== undefined) update.starts_at = body.starts_at;
  if (body.ends_at !== undefined) update.ends_at = body.ends_at || null;
  if (body.location !== undefined)
    update.location = body.location?.toString().trim() || null;
  if (body.capacity !== undefined) {
    const capacity = Number(body.capacity);
    if (!Number.isFinite(capacity) || capacity < 0) {
      return NextResponse.json(
        { error: "Aantal plekken is ongeldig." },
        { status: 400 },
      );
    }
    update.capacity = capacity;
  }
  if (body.status !== undefined)
    update.status = body.status === "closed" ? "closed" : "open";

  const { data, error } = await guard.ctx.supabase
    .from("course_dates")
    .update(update)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Bijwerken mislukt." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await guardAdminApi();
  if (!guard.ok) return guard.response;
  const { id } = await params;

  const { error } = await guard.ctx.supabase
    .from("course_dates")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Verwijderen mislukt." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
