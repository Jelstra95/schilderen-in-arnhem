import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

export interface AuthContext {
  supabase: SupabaseClient;
  user: User | null;
  profile: Profile | null;
}

/**
 * Resolves the current user + profile. Safe to call from Route Handlers and
 * Server Components — never redirects, lets the caller decide the response.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { supabase, user, profile: (profile as Profile) ?? null };
}

/** For Server Components/pages: redirect to /login unless an admin. */
export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx.user) redirect("/login?redirect=/admin");
  if (ctx.profile?.role !== "admin") redirect("/dashboard");
  return ctx;
}

/** For Server Components/pages: redirect to /login unless signed in. */
export async function requireParticipant(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx.user) redirect("/login?redirect=/dashboard");
  return ctx;
}
