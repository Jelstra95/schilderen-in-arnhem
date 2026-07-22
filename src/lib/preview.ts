import "server-only";
import { cookies } from "next/headers";
import { getAuthContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Material, Profile } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** httpOnly cookie holding the id of the participant an admin is previewing. */
export const PREVIEW_COOKIE = "preview_as";

export interface ViewerContext {
  /** True when an admin is viewing the participant area as a specific student. */
  isPreview: boolean;
  /** The identity whose data should be shown (participant in preview, else self). */
  viewer: Profile | null;
  /**
   * Client to read viewer-scoped data with:
   *  - normal participant → their session client (RLS enforces scoping)
   *  - preview            → the service-role client (RLS bypassed; callers must
   *                         scope manually, e.g. via {@link materialsOrFilter})
   */
  db: SupabaseClient;
}

/**
 * Resolves who the participant area should render as. Only an admin may preview,
 * and only a real participant may be the target — a forged cookie on a
 * non-admin session is ignored, so this grants no extra privilege (an admin can
 * already read everything; the scoping below is about fidelity, not access).
 */
export async function getViewerContext(): Promise<ViewerContext> {
  const { supabase, profile } = await getAuthContext();

  if (profile?.role === "admin") {
    const store = await cookies();
    const targetId = store.get(PREVIEW_COOKIE)?.value;
    if (targetId) {
      const admin = createAdminClient();
      const { data: target } = await admin
        .from("profiles")
        .select("*")
        .eq("id", targetId)
        .eq("role", "participant")
        .maybeSingle();
      if (target) {
        return { isPreview: true, viewer: target as Profile, db: admin };
      }
    }
  }

  return { isPreview: false, viewer: profile, db: supabase };
}

/**
 * PostgREST `.or()` filter that restricts a `materials` query to what the given
 * participant may see — mirroring the RLS window policy (migration 0003):
 * undated ("general") material, plus material whose `taught_on` falls inside the
 * participant's access window. Only needed in preview, where the service-role
 * client bypasses RLS.
 */
export function materialsOrFilter(viewer: Profile): string {
  const start = viewer.access_starts_on;
  if (!start) return "taught_on.is.null"; // no window → only general material
  const end = viewer.access_ends_on;
  const within = end
    ? `and(taught_on.gte.${start},taught_on.lte.${end})`
    : `taught_on.gte.${start}`;
  return `taught_on.is.null,${within}`;
}

/** Pure check mirroring {@link materialsOrFilter} for a single material row. */
export function isMaterialVisibleToViewer(
  material: Pick<Material, "taught_on">,
  viewer: Profile,
): boolean {
  if (material.taught_on === null) return true;
  const start = viewer.access_starts_on;
  if (!start) return false;
  if (material.taught_on < start) return false;
  const end = viewer.access_ends_on;
  if (end && material.taught_on > end) return false;
  return true;
}
