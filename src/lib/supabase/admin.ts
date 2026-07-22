import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Returns the name of the first required admin-client env var that is missing,
 * or null when both are present. Lets callers fail gracefully (a clear message)
 * instead of letting `createAdminClient()` throw an opaque 500 — e.g. when the
 * server-only service-role key was never configured in a deploy environment.
 */
export function missingAdminEnv(): string | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return "NEXT_PUBLIC_SUPABASE_URL";
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return "SUPABASE_SERVICE_ROLE_KEY";
  return null;
}

/**
 * Service-role Supabase client. Bypasses RLS — use ONLY in server code for
 * privileged operations (creating participant accounts, reading private
 * storage objects). Never import this into a client component.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

export const MATERIALS_BUCKET =
  process.env.SUPABASE_MATERIALS_BUCKET || "course-materials";
