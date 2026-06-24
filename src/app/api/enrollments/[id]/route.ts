import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";

/**
 * Cancel an enrollment. RLS restricts the update to the participant's own
 * enrollment (or an admin). Cancelling frees the spot automatically, since the
 * availability view only counts pending/confirmed rows.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await getAuthContext();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("enrollments")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Annuleren is niet gelukt." },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: "Inschrijving niet gevonden." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
