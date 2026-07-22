import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null): string {
  // Only allow internal paths to avoid open-redirects.
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

/**
 * Auth redirect target for the links Supabase e-mails (password recovery,
 * invites, …). Establishes the session from the link — either the PKCE `code`
 * or a `token_hash` + `type` one-time code — then forwards to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    ok = !error;
  }

  if (!ok) {
    // Missing/expired/invalid link — send them back to request a fresh one.
    return NextResponse.redirect(
      new URL("/wachtwoord-vergeten?fout=link", origin),
    );
  }

  return NextResponse.redirect(new URL(next, origin));
}
