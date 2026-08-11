import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, missingAdminEnv } from "@/lib/supabase/admin";

/**
 * Keeps the Supabase project awake. Free-tier projects are paused after ~7 days
 * of low activity, so a Vercel cron job (see `vercel.json`) calls this daily and
 * we run one cheap query against Postgres to register real API activity.
 *
 * Runs unauthenticated from Vercel's side, so it is guarded by CRON_SECRET,
 * which Vercel sends automatically as `Authorization: Bearer <secret>`.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // Deliberately loud: without the secret the endpoint would be open to
    // anyone, so we refuse rather than silently skipping the health check.
    console.error("[keepalive] CRON_SECRET is not configured");
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const missing = missingAdminEnv();
  if (missing) {
    console.error(`[keepalive] missing env var ${missing}`);
    return NextResponse.json({ error: `Ontbrekende configuratie: ${missing}.` }, { status: 500 });
  }

  const admin = createAdminClient();
  // head:true fetches no rows — just enough of a query to count as activity.
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("[keepalive] Supabase query failed", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 });
  }

  console.log(`[keepalive] ok — ${count} profiles`);
  return NextResponse.json(
    { ok: true, profiles: count },
    { headers: { "Cache-Control": "no-store" } },
  );
}
