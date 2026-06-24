import { createClient } from "@/lib/supabase/server";
import type { CourseDateWithAvailability } from "@/lib/types";

interface ListOptions {
  /** Only dates that start in the future. */
  upcomingOnly?: boolean;
  /** Only dates with status = 'open'. */
  openOnly?: boolean;
}

/**
 * Reads course dates with computed availability from the
 * `course_dates_availability` view (publicly readable, exposes counts only).
 */
export async function getCourseDatesWithAvailability(
  options: ListOptions = {},
): Promise<CourseDateWithAvailability[]> {
  const supabase = await createClient();
  let query = supabase
    .from("course_dates_availability")
    .select("*")
    .order("starts_at", { ascending: true });

  if (options.openOnly) query = query.eq("status", "open");
  if (options.upcomingOnly)
    query = query.gte("starts_at", new Date().toISOString());

  const { data, error } = await query;
  if (error) throw error;
  return (data as CourseDateWithAvailability[]) ?? [];
}
