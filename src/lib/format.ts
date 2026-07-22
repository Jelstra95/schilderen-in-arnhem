// Dutch-locale formatting helpers.

const DATE_FMT = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const TIME_FMT = new Intl.DateTimeFormat("nl-NL", {
  hour: "2-digit",
  minute: "2-digit",
});

const SHORT_FMT = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDate(iso: string): string {
  return DATE_FMT.format(new Date(iso));
}

const DAY_FMT = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats a date-only value ("YYYY-MM-DD"), parsed as UTC to avoid TZ drift. */
export function formatDay(dateOnly: string): string {
  return DAY_FMT.format(new Date(`${dateOnly}T00:00:00Z`));
}

export function formatShortDate(iso: string): string {
  return SHORT_FMT.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return TIME_FMT.format(new Date(iso));
}

export function formatDateTimeRange(startIso: string, endIso: string | null): string {
  const start = formatDate(startIso);
  const startTime = formatTime(startIso);
  if (!endIso) return `${start} · ${startTime}`;
  return `${start} · ${startTime}–${formatTime(endIso)}`;
}

/** Capitalises the first letter (Dutch weekday names come back lowercased). */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
