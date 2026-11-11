// Shared validation for the admin inquiry/participant routes.

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_LEN = 5000;

/** The password every new participant account is created with. */
export const DEFAULT_PASSWORD = "olieverf";

/** Day options shown in the admin; keep in sync with AanmeldForm. */
export const DAY_OPTIONS = ["Dinsdagavond", "Woensdagavond"] as const;

/** Local date as YYYY-MM-DD. */
export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/**
 * Parses a date-only field. Returns `undefined` when the field is absent,
 * `null` when it was cleared, the date string when valid, and `false` when the
 * value is not a valid date.
 */
export function parseDate(value: unknown): string | null | undefined | false {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const s = String(value).trim();
  if (!DATE_RE.test(s) || Number.isNaN(Date.parse(s))) return false;
  return s;
}

/**
 * Parses an optional text field. Returns `undefined` when absent, `null` when
 * empty, the trimmed string otherwise, and `false` when it is too long.
 */
export function parseText(value: unknown): string | null | undefined | false {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const s = String(value).trim();
  if (s.length > MAX_LEN) return false;
  return s || null;
}
