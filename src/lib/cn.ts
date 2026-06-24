/** Joins truthy class names. Minimal — no merge logic needed for our usage. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
