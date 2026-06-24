import "server-only";
import { createClient } from "@supabase/supabase-js";

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
