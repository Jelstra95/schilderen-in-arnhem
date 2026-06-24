import { NextResponse } from "next/server";
import { getAuthContext, type AuthContext } from "@/lib/auth";

type GuardResult =
  | { ok: true; ctx: AuthContext }
  | { ok: false; response: NextResponse };

/** Guard for admin-only Route Handlers. Returns a 401/403 response if not an admin. */
export async function guardAdminApi(): Promise<GuardResult> {
  const ctx = await getAuthContext();
  if (!ctx.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Niet ingelogd." }, { status: 401 }),
    };
  }
  if (ctx.profile?.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Geen toegang." }, { status: 403 }),
    };
  }
  return { ok: true, ctx };
}
